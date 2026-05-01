import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

export default function PaymentCancelScreen() {
  return (
    <View style={styles.page}>
      <Text style={styles.title}>支払いがキャンセルされました</Text>
      <Text style={styles.message}>必要ならカート画面から再度支払いを実行してください。</Text>
      <Pressable style={styles.btn} onPress={() => router.replace("/(tabs)/cart")}>
        <Text style={styles.btnText}>カートへ戻る</Text>
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

