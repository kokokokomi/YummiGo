import { useState } from "react";
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { router } from "expo-router";

import { updateUserPassword } from "@/src/api/user";

export default function ProfilePasswordScreen() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    // 中文注释：后端当前只要求新密码，前端保留当前密码与确认输入用于提升流程完整性
    if (!currentPassword) {
      Alert.alert("入力エラー", "現在のパスワードを入力してください");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert("入力エラー", "新しいパスワードは6文字以上で入力してください");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("入力エラー", "確認用パスワードが一致しません");
      return;
    }
    try {
      setSubmitting(true);
      await updateUserPassword(newPassword);
      Alert.alert("更新完了", "パスワードを更新しました");
      router.back();
    } catch (e: any) {
      Alert.alert("更新失敗", e?.message || "パスワード更新に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.card}>
          <Text style={styles.title}>パスワード変更</Text>
          <TextInput
            style={styles.input}
            placeholder="現在のパスワード"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="新しいパスワード"
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="新しいパスワード（確認）"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
          <Pressable style={[styles.submit, submitting && { opacity: 0.7 }]} onPress={onSubmit} disabled={submitting}>
            <Text style={styles.submitText}>{submitting ? "更新中..." : "パスワードを更新"}</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 12 },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, gap: 10 },
  title: { fontSize: 16, fontWeight: "700", color: "#111827" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 10 },
  submit: { marginTop: 4, backgroundColor: "#2563eb", borderRadius: 10, paddingVertical: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700" },
});
