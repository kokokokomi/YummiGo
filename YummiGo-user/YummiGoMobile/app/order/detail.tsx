import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { MaterialIcons } from "@expo/vector-icons";
import { cancelOrder, createOrderPayment, getOrderById, remindOrder } from "@/src/api/order";
import { normalizeMajorAmount, toMinorUnit } from "@/src/lib/currency";
import type { OrderVO } from "@/src/types/api";
import {
  getMerchantRejectReason,
  shouldNotifyMerchantReject,
  showMerchantRejectAlert,
} from "@/src/lib/orderRejection";

function statusHeadline(status: number, payStatus: number) {
  if (status === 6) return { title: "キャンセル済み", sub: "この注文はキャンセルされました" };
  if (status === 1 && payStatus !== 1) return { title: "支払い待ち", sub: "15分以内にお支払いください" };
  if (status === 2) return { title: "受付待ち", sub: "店舗が注文を確認しています" };
  if (status === 3) return { title: "配達待ち", sub: "料理の準備が進んでいます" };
  if (status === 4) return { title: "配達中", sub: "お届けに向かっています" };
  if (status === 5) return { title: "配達完了", sub: "ご利用ありがとうございました" };
  return { title: "注文処理中", sub: "" };
}

export default function OrderDetailScreen() {
  const { id, countdownStart } = useLocalSearchParams<{ id?: string; countdownStart?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const lastStatusRef = useRef<number | undefined>(undefined);
  const rejectAlertShownRef = useRef(false);

  const parseOrderTimeMs = useCallback((raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const unix = Number(text);
    if (Number.isFinite(unix) && unix > 0) return unix > 1e12 ? unix : unix * 1000;
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

  const itemsSubtotal = useMemo(
    () => (order?.orderDetailList || []).reduce((sum, item) => sum + toAmount(item.amount), 0),
    [order, toAmount]
  );

  const resolveOrderStartMs = useCallback((raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const normalized = text.replace(" ", "T");
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const candidates = [new Date(normalized).getTime(), new Date(`${normalized}Z`).getTime()].filter((v) => !Number.isNaN(v));
    if (candidates.length === 0) return parseOrderTimeMs(raw);
    const inWindow = candidates.filter((ts) => now >= ts && now - ts <= windowMs);
    if (inWindow.length > 0) return Math.max(...inWindow);
    const notFuture = candidates.filter((ts) => ts <= now + 60 * 1000);
    if (notFuture.length > 0) return Math.max(...notFuture);
    return Math.min(...candidates);
  }, [parseOrderTimeMs]);

  const applyOrderUpdate = useCallback((data: OrderVO, notifyReject = true) => {
    const prevStatus = lastStatusRef.current;
    if (notifyReject && !rejectAlertShownRef.current && shouldNotifyMerchantReject(prevStatus, data)) {
      rejectAlertShownRef.current = true;
      showMerchantRejectAlert(getMerchantRejectReason(data));
    }
    lastStatusRef.current = data.status;
    setOrder(data);
  }, []);

  useEffect(() => {
    (async () => {
      if (!id) return;
      try {
        const data = await getOrderById(String(id));
        lastStatusRef.current = undefined;
        rejectAlertShownRef.current = false;
        applyOrderUpdate(data, true);
      } finally {
        setLoading(false);
      }
    })();
  }, [id, applyOrderUpdate]);

  useEffect(() => {
    if (!id || !order || order.status !== 2) return;
    const timer = setInterval(async () => {
      try {
        const latest = await getOrderById(String(id));
        applyOrderUpdate(latest, true);
      } catch {
        // ignore
      }
    }, 5000);
    return () => clearInterval(timer);
  }, [id, order?.status, applyOrderUpdate]);

  useEffect(() => {
    if (!order || order.status !== 1 || order.payStatus === 1) {
      setRemainingSeconds(0);
      return;
    }
    const fromParam = Number(countdownStart);
    const startMs = Number.isFinite(fromParam) && fromParam > 0 ? fromParam : resolveOrderStartMs(order.orderTime);
    const fallbackStart = Number.isNaN(startMs) ? Date.now() : startMs;
    const expireAt = fallbackStart + 15 * 60 * 1000;
    const tick = () => setRemainingSeconds(Math.max(0, Math.floor((expireAt - Date.now()) / 1000)));
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [countdownStart, order, resolveOrderStartMs]);

  const countdownText = useMemo(() => {
    const m = Math.floor(remainingSeconds / 60);
    const s = remainingSeconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [remainingSeconds]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }
  if (!order) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>注文情報がありません</Text>
      </View>
    );
  }

  const rejectReason = getMerchantRejectReason(order);
  const headline = statusHeadline(order.status, order.payStatus);

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
      applyOrderUpdate(latest, false);
      Alert.alert("完了", "注文をキャンセルしました");
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "キャンセルに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.page}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.main}>
            <View style={styles.statusCard}>
              <Text style={styles.statusTitle}>{headline.title}</Text>
              <Text style={styles.statusSub}>{headline.sub}</Text>
              {order.status === 1 && order.payStatus !== 1 && (
                <View style={styles.countdownRow}>
                  <MaterialIcons name="timer" size={16} color="#dc2626" />
                  <Text style={styles.countdownText}>残り {countdownText}</Text>
                </View>
              )}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>注文情報</Text>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>注文番号</Text>
                <Text style={styles.infoValue}>{order.number}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>注文時間</Text>
                <Text style={styles.infoValue}>{order.orderTime || "-"}</Text>
              </View>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>お届け予定</Text>
                <Text style={styles.infoValue}>{order.estimatedDeliveryTime || order.deliveryTime || "-"}</Text>
              </View>
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>配送先</Text>
              <Text style={styles.addressText}>{order.snapshotAddress || "-"}</Text>
              {order.snapshotConsignee ? <Text style={styles.addressSub}>{order.snapshotConsignee}</Text> : null}
              {order.remark ? <Text style={styles.remarkText}>備考: {order.remark}</Text> : null}
            </View>

            {order.status === 6 && rejectReason ? (
              <View style={styles.rejectCard}>
                <Text style={styles.rejectTitle}>店舗により拒否されました</Text>
                <Text style={styles.rejectReason}>{rejectReason}</Text>
              </View>
            ) : null}

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>商品</Text>
              {(order.orderDetailList || []).map((item) => (
                <View key={String(item.id)} style={styles.dishRow}>
                  {item.image ? (
                    <Image source={{ uri: resolveImage(item.image) }} style={styles.dishImage} />
                  ) : (
                    <View style={styles.dishImagePlaceholder}>
                      <MaterialIcons name="restaurant" size={20} color="#cbd5e1" />
                    </View>
                  )}
                  <View style={styles.dishInfo}>
                    <Text style={styles.dishName} numberOfLines={2}>{item.name}</Text>
                    {item.dishFlavor ? <Text style={styles.dishFlavor}>{item.dishFlavor}</Text> : null}
                    <Text style={styles.dishMeta}>x{item.number}</Text>
                  </View>
                  <Text style={styles.dishPrice}>{formatJPY(item.amount)}</Text>
                </View>
              ))}
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.cardTitle}>料金明細</Text>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>小計</Text>
                <Text style={styles.priceValue}>{formatJPY(itemsSubtotal)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>配達料</Text>
                <Text style={styles.priceValue}>{formatJPY(deliveryFee)}</Text>
              </View>
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>梱包料</Text>
                <Text style={styles.priceValue}>{formatJPY(order.packAmount)}</Text>
              </View>
              <View style={[styles.priceRow, styles.priceTotalRow]}>
                <Text style={styles.priceTotalLabel}>合計</Text>
                <Text style={styles.priceTotalValue}>{formatJPY(order.amount)}</Text>
              </View>
            </View>
        </View>
      </ScrollView>

      {(order.status === 1 || order.status === 2) && (
        <View style={styles.bottomBar}>
          {order.status === 1 && (
            <Pressable style={[styles.actionBtn, styles.payBtn, submitting && styles.btnDisabled]} disabled={submitting} onPress={onRepay}>
              <Text style={styles.actionBtnText}>支払う</Text>
            </Pressable>
          )}
          {order.status === 2 && order.payStatus === 1 && (
            <Pressable style={[styles.actionBtn, styles.remindBtn, submitting && styles.btnDisabled]} disabled={submitting} onPress={onRemind}>
              <Text style={styles.actionBtnText}>催促</Text>
            </Pressable>
          )}
          <Pressable style={[styles.actionBtn, styles.cancelBtn, submitting && styles.btnDisabled]} disabled={submitting} onPress={onCancel}>
            <Text style={styles.cancelBtnText}>キャンセル</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f3f4f6" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f3f4f6" },
  emptyText: { color: "#6b7280" },
  scrollContent: { paddingBottom: 100 },
  main: { flex: 1, padding: 12, gap: 10 },
  statusCard: {
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#fde68a",
    backgroundColor: "#fffbeb",
  },
  statusTitle: { fontSize: 20, fontWeight: "800", color: "#92400e" },
  statusSub: { marginTop: 4, fontSize: 13, color: "#b45309" },
  countdownRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 8 },
  countdownText: { color: "#dc2626", fontWeight: "800", fontSize: 15 },
  infoCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 12,
    gap: 8,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
  },
  cardTitle: { fontSize: 15, fontWeight: "800", color: "#111827", marginBottom: 2 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  infoLabel: { color: "#6b7280", fontSize: 13 },
  infoValue: { color: "#111827", fontSize: 13, fontWeight: "600", flexShrink: 1, textAlign: "right" },
  addressText: { color: "#111827", fontSize: 14, lineHeight: 20 },
  addressSub: { color: "#6b7280", fontSize: 13, marginTop: 4 },
  remarkText: { color: "#9ca3af", fontSize: 12, marginTop: 6 },
  rejectCard: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fecaca",
    borderRadius: 12,
    padding: 12,
    gap: 4,
  },
  rejectTitle: { color: "#991b1b", fontWeight: "800", fontSize: 14 },
  rejectReason: { color: "#7f1d1d", fontSize: 13, lineHeight: 18 },
  dishRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 6 },
  dishImage: { width: 52, height: 52, borderRadius: 8, backgroundColor: "#f1f5f9" },
  dishImagePlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  dishInfo: { flex: 1 },
  dishName: { fontSize: 14, fontWeight: "700", color: "#111827" },
  dishFlavor: { fontSize: 12, color: "#6b7280", marginTop: 2 },
  dishMeta: { fontSize: 12, color: "#9ca3af", marginTop: 2 },
  dishPrice: { fontSize: 14, fontWeight: "800", color: "#111827" },
  priceRow: { flexDirection: "row", justifyContent: "space-between" },
  priceLabel: { color: "#6b7280", fontSize: 13 },
  priceValue: { color: "#374151", fontSize: 13 },
  priceTotalRow: {
    marginTop: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
  },
  priceTotalLabel: { color: "#111827", fontSize: 15, fontWeight: "800" },
  priceTotalValue: { color: "#dc2626", fontSize: 18, fontWeight: "800" },
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: -2 },
    shadowRadius: 8,
    elevation: 8,
  },
  actionBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  payBtn: { backgroundColor: "#f59e0b" },
  remindBtn: { backgroundColor: "#3b82f6" },
  cancelBtn: { backgroundColor: "#f3f4f6", borderWidth: 1, borderColor: "#e5e7eb" },
  actionBtnText: { fontWeight: "800", fontSize: 14, color: "#fff" },
  cancelBtnText: { fontWeight: "800", fontSize: 14, color: "#374151" },
  btnDisabled: { opacity: 0.55 },
});
