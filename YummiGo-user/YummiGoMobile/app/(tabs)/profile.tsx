import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";

import { API_BASE_URL } from "@/src/config/env";
import { useAuth } from "@/src/state/auth";

export default function ProfileScreen() {
  const { profile, logout } = useAuth();

  const onLogout = async () => {
    await logout();
    router.replace("/login");
  };

  return (
    <View style={styles.page}>
      <View style={styles.card}>
        <Image
          source={profile?.avatar ? { uri: profile.avatar } : require("../../assets/images/icon.png")}
          style={styles.avatar}
        />
        <Text style={styles.name}>{profile?.name || "ユーザー"}</Text>
        <Text style={styles.line}>メール: {profile?.email || "-"}</Text>
        <Text style={styles.help}>API: {API_BASE_URL}</Text>
      </View>

      <Pressable style={styles.editBtn} onPress={() => router.push("/profile/edit")}>
        <Text style={styles.editBtnText}>個人情報を編集</Text>
      </Pressable>

      <Pressable style={styles.addrBtn} onPress={() => router.push("/profile/address")}>
        <Text style={styles.addrBtnText}>住所管理</Text>
      </Pressable>

      <Pressable style={styles.logoutBtn} onPress={onLogout}>
        <Text style={styles.logoutText}>ログアウト</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 12, gap: 10 },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 16, gap: 8, alignItems: "center" },
  avatar: { width: 86, height: 86, borderRadius: 43, backgroundColor: "#e5e7eb" },
  name: { fontSize: 20, fontWeight: "800", color: "#111827", marginTop: 2 },
  line: { color: "#374151", fontSize: 14 },
  help: { color: "#9ca3af", fontSize: 12 },
  logoutBtn: { marginTop: 8, backgroundColor: "#ef4444", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  logoutText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  editBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  editBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
  addrBtn: { backgroundColor: "#2563eb", borderRadius: 12, paddingVertical: 13, alignItems: "center" },
  addrBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});

