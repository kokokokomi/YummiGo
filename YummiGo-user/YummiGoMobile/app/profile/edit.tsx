import { useMemo, useState } from "react";
import {
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { router } from "expo-router";
import { useAuth } from "@/src/state/auth";
import { updateUserInfo, uploadAvatar } from "@/src/api/user";

export default function ProfileEditScreen() {
  const { profile, reloadProfile } = useAuth();
  const [name, setName] = useState(profile?.name || "");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [saving, setSaving] = useState(false);
  const email = useMemo(() => profile?.email || "-", [profile?.email]);

  const onPickAvatar = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("権限不足", "写真ライブラリの権限を許可してください");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.length) return;
    const asset = result.assets[0];
    if ((asset.fileSize || 0) > 5 * 1024 * 1024) {
      Alert.alert("サイズ超過", "画像サイズは 5MB 以内にしてください");
      return;
    }
    try {
      const uploadedUrl = await uploadAvatar(asset.uri);
      setAvatar(uploadedUrl);
    } catch (e: any) {
      Alert.alert("アップロード失敗", e?.message || "画像のアップロードに失敗しました");
    }
  };

  const onSaveInfo = async () => {
    try {
      setSaving(true);
      await updateUserInfo({ name, avatar: avatar || undefined });
      await reloadProfile();
      Alert.alert("成功", "個人情報を更新しました");
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "更新に失敗しました");
    } finally {
      setSaving(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 10, paddingBottom: 20 }}>
          <View style={styles.card}>
            <Text style={styles.title}>個人情報の編集</Text>
            <Pressable style={styles.avatarWrap} onPress={onPickAvatar}>
              <Image source={avatar ? { uri: avatar } : require("../../assets/images/icon.png")} style={styles.avatar} />
              <View style={styles.editBadge}>
                <Text style={styles.editBadgeText}>編集</Text>
              </View>
            </Pressable>
            <Text style={styles.tip}>JPG / PNG, 最大 5MB</Text>
            <Text style={styles.label}>ユーザー名</Text>
            <TextInput style={styles.input} placeholder="名前" value={name} onChangeText={setName} />
            <Text style={styles.label}>メール（読み取り専用）</Text>
            <View style={styles.readonly}>
              <Text style={styles.readonlyText}>{email}</Text>
            </View>
            <Pressable style={[styles.primaryBtn, saving && { opacity: 0.7 }]} onPress={onSaveInfo} disabled={saving}>
              <Text style={styles.primaryText}>{saving ? "保存中..." : "保存"}</Text>
            </Pressable>
          </View>

          <View style={styles.card}>
            <Text style={styles.title}>アカウント安全</Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.push("/profile/password")}>
              <Text style={styles.primaryText}>パスワードを変更する</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, gap: 8 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  avatarWrap: { alignSelf: "center", marginVertical: 6 },
  avatar: { width: 96, height: 96, borderRadius: 48, backgroundColor: "#e5e7eb" },
  editBadge: { position: "absolute", right: -2, bottom: -2, backgroundColor: "#2563eb", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  editBadgeText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  tip: { textAlign: "center", color: "#6b7280", fontSize: 12 },
  label: { color: "#374151", fontWeight: "700", marginTop: 2 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9 },
  readonly: { borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: "#f8fafc" },
  readonlyText: { color: "#6b7280" },
  primaryBtn: { backgroundColor: "#2563eb", borderRadius: 10, alignItems: "center", paddingVertical: 11 },
  primaryText: { color: "#fff", fontWeight: "700" },
});

