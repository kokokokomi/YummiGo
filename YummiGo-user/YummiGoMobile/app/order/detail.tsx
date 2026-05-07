import { useCallback, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { cancelOrder, createOrderPayment, getOrderById, remindOrder } from "@/src/api/order";
import { normalizeMajorAmount, toMinorUnit } from "@/src/lib/currency";
import type { OrderVO } from "@/src/types/api";

export default function OrderDetailScreen() {
  const { id, countdownStart } = useLocalSearchParams<{ id?: string; countdownStart?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  const parseOrderTimeMs = useCallback((raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const unix = Number(text);
    if (Number.isFinite(unix) && unix > 0) {
      return unix > 1e12 ? unix : unix * 1000;
    }
    const normalized = text.replace(" ", "T");
    const direct = new Date(normalized).getTime();
    if (!Number.isNaN(direct)) return direct;
    return NaN;
  }, []);
  const resolveImage = useCallback((img?: string) => {
    if (!img) return "";
    if (/^(https?:)?\/\//.test(img) || img.startsWith("data:")) return img;
    const base = process.env.EXPO_PUBLIC_API_BASE_URL || "";
    return `${base}${img.startsWith("/") ? "" : "/"}${img}`;
  }, []);
  const toAmount = useCallback((value: unknown) => {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }, []);
  const formatJPY = useCallback((value: unknown) => `¥${Math.round(toAmount(value))}`, [toAmount]);
  const deliveryFee = useMemo(() => {
    const candidates = [(order as any)?.deliveryFee, (order as any)?.deliveryAmount, (order as any)?.dispatchAmount, (order as any)?.freight];
    const fee = candidates.map((x) => toAmount(x)).find((x) => x > 0);
    if (fee && fee > 0) return fee;
    const details = (order?.orderDetailList || []).reduce((sum, item) => sum + toAmount(item.amount), 0);
    const pack = toAmount(order?.packAmount);
    const inferred = toAmount(order?.amount) - details - pack;
    return inferred > 0 ? inferred : 0;
  }, [order, toAmount]);

  const resolveOrderStartMs = useCallback((raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const normalized = text.replace(" ", "T");
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const candidates = [new Date(normalized).getTime(), new Date(`${normalized}Z`).getTime()].filter((v) => !Number.isNaN(v));
    if (candidates.length === 0) return parseOrderTimeMs(raw);
    // 中文注释：优先选择“当前仍在 15 分钟支付窗口内”的时间解释；兼容后端 UTC/本地时区混用
    const inWindow = candidates.filter((ts) => now >= ts && now - ts <= windowMs);
    if (inWindow.length > 0) return Math.max(...inWindow);
    const notFuture = candidates.filter((ts) => ts <= now + 60 * 1000);
    if (notFuture.length > 0) return Math.max(...notFuture);
    return Math.min(...candidates);
  }, [parseOrderTimeMs]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await getOrderById(String(id));
        setOrder(data);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!order || order.status !== 1 || order.payStatus === 1) {
      setRemainingSeconds(0);
      return;
    }
    const fromParam = Number(countdownStart);
    const startMs = Number.isFinite(fromParam) && fromParam > 0 ? fromParam : resolveOrderStartMs(order.orderTime);
    const fallbackStart = Number.isNaN(startMs) ? Date.now() : startMs;
    const expireAt = fallbackStart + 15 * 60 * 1000;
    const tick = () => {
      const left = Math.max(0, Math.floor((expireAt - Date.now()) / 1000));
      setRemainingSeconds(left);
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [countdownStart, order, resolveOrderStartMs]);

  const countdownText = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingSeconds]);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!order) return <View style={styles.center}><Text>注文情報がありません</Text></View>;

  const onRepay = async () => {
    try {
      setSubmitting(true);
      const successUrl = Linking.createURL(`/payment/success?orderId=${order.id}`);
      const cancelUrl = Linking.createURL(`/payment/cancel?orderId=${order.id}`);
      const currency = "jpy";
      const normalizedAmount = normalizeMajorAmount(Number(order.amount), currency);
      const pay = await createOrderPayment({
        payMethod: 2,
        orderId: String(order.id),
        orderNumber: order.number,
        currency,
        amountInCents: toMinorUnit(normalizedAmount, currency),
        successUrl,
        cancelUrl,
      });
      await WebBrowser.openBrowserAsync(pay.checkoutUrl);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "支払いに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const onRemind = async () => {
    try {
      setSubmitting(true);
      await remindOrder(String(order.id));
      Alert.alert("送信済み", "店舗に催促を通知しました");
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "催促に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async () => {
    try {
      setSubmitting(true);
      await cancelOrder(String(order.id));
      const latest = await getOrderById(String(order.id));
      setOrder(latest);
      Alert.alert("完了", "注文をキャンセルしました");
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "キャンセルに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <Text style={styles.title}>注文番号: {order.number}</Text>
      <Text style={styles.meta}>住所: {order.snapshotAddress || "-"}</Text>
      <Text style={styles.meta}>備考: {order.remark || "-"}</Text>
      <Text style={styles.meta}>合計: {formatJPY(order.amount)}</Text>
      <Text style={styles.meta}>配達料: {formatJPY(deliveryFee)}</Text>
      <Text style={styles.meta}>梱包料: {formatJPY(order.packAmount)}</Text>
      <Text style={styles.meta}>お届け予定: {order.estimatedDeliveryTime || order.deliveryTime || "-"}</Text>
      {order.status === 1 && order.payStatus !== 1 && (
        <View style={styles.countdownCard}>
          <Text style={styles.countdownTitle}>支払い待ち</Text>
          <Text style={styles.countdownTime}>{countdownText}</Text>
          <Text style={styles.countdownTip}>15分以内に支払いが完了しない場合、注文は自動キャンセルされます。</Text>
        </View>
      )}
      {(order.status === 1 || order.status === 2) && (
        <View style={styles.actions}>
          {order.status === 1 && (
            <Pressable style={[styles.btn, styles.payBtn, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={onRepay}>
              <Text style={styles.btnText}>支払い</Text>
            </Pressable>
          )}
          {order.status === 2 && order.payStatus === 1 && (
            <Pressable style={[styles.btn, styles.remindBtn, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={onRemind}>
              <Text style={styles.btnText}>店舗に催促</Text>
            </Pressable>
          )}
          <Pressable style={[styles.btn, styles.cancelBtn, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={onCancel}>
            <Text style={styles.btnText}>キャンセル</Text>
          </Pressable>
        </View>
      )}
      <FlatList
        data={order.orderDetailList || []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 8, marginTop: 12 }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            {item.image ? <Image source={{ uri: resolveImage(item.image) }} style={styles.thumb} /> : <View style={styles.thumb} />}
            <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.dishFlavor || "-"}</Text>
            <Text style={styles.itemSub}>x{item.number} / {formatJPY(item.amount)}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 12 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  meta: { color: "#4b5563", marginTop: 4 },
  countdownCard: {
    marginTop: 10,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 10,
    padding: 10,
    gap: 4,
  },
  countdownTitle: { color: "#9a3412", fontWeight: "700" },
  countdownTime: { color: "#dc2626", fontSize: 22, fontWeight: "800" },
  countdownTip: { color: "#7c2d12", fontSize: 12 },
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  payBtn: { backgroundColor: "#2563eb" },
  remindBtn: { backgroundColor: "#f59e0b" },
  cancelBtn: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700" },
  item: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, flexDirection: "row", gap: 10 },
  thumb: { width: 54, height: 54, borderRadius: 8, backgroundColor: "#e5e7eb" },
  itemName: { fontWeight: "700", color: "#111827" },
  itemSub: { color: "#6b7280", marginTop: 2 },
});

