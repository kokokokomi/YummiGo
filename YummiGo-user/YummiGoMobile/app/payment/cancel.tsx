import { useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";

import { navigateToOrderDetail } from "@/src/lib/orderNavigation";

export default function PaymentCancelScreen() {
  const params = useLocalSearchParams<{ orderId?: string; countdownStart?: string }>();

  useEffect(() => {
    if (params.orderId) {
      navigateToOrderDetail(String(params.orderId), {
        countdownStart: params.countdownStart,
        fromCancel: "1",
      });
      return;
    }
    router.replace("/(tabs)/orders");
  }, [params.countdownStart, params.orderId]);

  return (
    <View style={styles.page}>
      <Text style={styles.title}>支払いがキャンセルされました</Text>
      <Text style={styles.message}>注文詳細ページで15分以内に再決済できます。</Text>
      <Pressable
        style={styles.btn}
        onPress={() => {
          if (params.orderId) {
            navigateToOrderDetail(String(params.orderId), {
              countdownStart: params.countdownStart,
              fromCancel: "1",
            });
            return;
          }
          router.replace("/(tabs)/orders");
        }}
      >
        <Text style={styles.btnText}>注文詳細へ</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 16, justifyContent: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: "#111827", textAlign: "center" },
  message: { color: "#374151", textAlign: "center" },
  btn: { backgroundColor: "#111827", borderRadius: 12, alignItems: "center", paddingVertical: 13, marginTop: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
});

