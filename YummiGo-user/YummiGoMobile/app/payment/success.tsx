import { useEffect, useState } from "react";
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

import { confirmPayment, getOrderById } from "@/src/api/order";
import type { OrderVO } from "@/src/types/api";

export default function PaymentSuccessScreen() {
  const params = useLocalSearchParams<{ session_id?: string; orderId?: string }>();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderVO | null>(null);
  const [message, setMessage] = useState("支払い情報を確認中...");

  useEffect(() => {
    (async () => {
      try {
        if (params.session_id) {
          const status = await confirmPayment(String(params.session_id));
          setMessage(status.payStatus === 1 ? "支払いが完了しました" : "支払いステータスを更新しました");
        } else {
          setMessage("session_id がないため、注文状態のみ表示します");
        }
        if (params.orderId) {
          const detail = await getOrderById(String(params.orderId));
          setOrder(detail);
        }
      } catch (e: any) {
        Alert.alert("確認失敗", e?.message || "支払い確認に失敗しました");
      } finally {
        setLoading(false);
      }
    })();
  }, [params.session_id, params.orderId]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <Text style={styles.title}>支払い結果</Text>
      <Text style={styles.message}>{message}</Text>

      {order && (
        <View style={styles.card}>
          <Text style={styles.line}>注文番号: {order.number}</Text>
          <Text style={styles.line}>状態: {order.status}</Text>
          <Text style={styles.line}>金額: ¥{Number(order.amount).toFixed(0)}</Text>
          <Text style={styles.line}>住所: {order.snapshotAddress || "-"}</Text>
        </View>
      )}

      <Pressable style={styles.btn} onPress={() => router.replace("/(tabs)/orders")}>
        <Text style={styles.btnText}>注文一覧へ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 16, gap: 12 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "700", color: "#111827" },
  message: { fontSize: 14, color: "#374151" },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, gap: 6 },
  line: { color: "#111827" },
  btn: { marginTop: 8, backgroundColor: "#2563eb", borderRadius: 12, alignItems: "center", paddingVertical: 13 },
  btnText: { color: "#fff", fontWeight: "700" },
});

