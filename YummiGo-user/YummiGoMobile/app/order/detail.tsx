import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { cancelOrder, createOrderPayment, getOrderById } from "@/src/api/order";
import type { OrderVO } from "@/src/types/api";

export default function OrderDetailScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [submitting, setSubmitting] = useState(false);

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

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  if (!order) return <View style={styles.center}><Text>注文情報がありません</Text></View>;

  const onRepay = async () => {
    try {
      setSubmitting(true);
      const successUrl = Linking.createURL(`/payment/success?orderId=${order.id}`);
      const cancelUrl = Linking.createURL(`/payment/cancel?orderId=${order.id}`);
      const pay = await createOrderPayment({
        payMethod: 2,
        orderId: String(order.id),
        orderNumber: order.number,
        currency: "jpy",
        amountInCents: Math.round(Number(order.amount) * 100),
        successUrl,
        cancelUrl,
      });
      await WebBrowser.openBrowserAsync(pay.checkoutUrl);
      router.replace("/(tabs)/orders");
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "支払いに失敗しました");
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
      Alert.alert("成功", "注文をキャンセルしました");
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
      <Text style={styles.meta}>合計: ¥{Number(order.amount).toFixed(0)}</Text>
      {(order.status === 1 || order.status === 2) && (
        <View style={styles.actions}>
          {order.status === 1 && (
            <Pressable style={[styles.btn, styles.payBtn, submitting && { opacity: 0.6 }]} disabled={submitting} onPress={onRepay}>
              <Text style={styles.btnText}>支払い</Text>
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
            {item.image ? <Image source={{ uri: item.image }} style={styles.thumb} /> : <View style={styles.thumb} />}
            <View style={{ flex: 1 }}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.dishFlavor || "-"}</Text>
            <Text style={styles.itemSub}>x{item.number} / ¥{Number(item.amount).toFixed(0)}</Text>
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
  actions: { flexDirection: "row", gap: 8, marginTop: 10 },
  btn: { borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14 },
  payBtn: { backgroundColor: "#2563eb" },
  cancelBtn: { backgroundColor: "#ef4444" },
  btnText: { color: "#fff", fontWeight: "700" },
  item: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, flexDirection: "row", gap: 10 },
  thumb: { width: 54, height: 54, borderRadius: 8, backgroundColor: "#e5e7eb" },
  itemName: { fontWeight: "700", color: "#111827" },
  itemSub: { color: "#6b7280", marginTop: 2 },
});

