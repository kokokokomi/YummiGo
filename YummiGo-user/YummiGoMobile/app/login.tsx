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
} from "react-native";
import { router } from "expo-router";

import { useAuth } from "@/src/state/auth";

export default function LoginScreen() {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    if (!email || !password) {
      Alert.alert("入力エラー", "メールアドレスとパスワードを入力してください");
      return;
    }
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      Alert.alert("ログイン失敗", e?.message || "ログインに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <Text style={styles.title}>YummiGo</Text>
      <Text style={styles.subtitle}>ユーザーログイン</Text>

      <TextInput
        style={styles.input}
        placeholder="メールアドレス"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
      />
      <TextInput
        style={styles.input}
        placeholder="パスワード"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Pressable style={[styles.button, submitting && styles.buttonDisabled]} onPress={onSubmit} disabled={submitting}>
        <Text style={styles.buttonText}>{submitting ? "処理中..." : "ログイン"}</Text>
      </Pressable>

      <Pressable style={[styles.button, styles.googleButton]} onPress={loginWithGoogle}>
        <Text style={[styles.buttonText, styles.googleButtonText]}>Googleでログイン</Text>
      </Pressable>

      <Text style={styles.tip}>注: 画面文言は日本語、コード注释は中文で統一しています。</Text>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
    backgroundColor: "#f7f8fa",
    gap: 12,
  },
  title: { fontSize: 36, fontWeight: "700", textAlign: "center", color: "#111827" },
  subtitle: { fontSize: 16, textAlign: "center", color: "#6b7280", marginBottom: 20 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#2563eb",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  googleButton: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#d1d5db" },
  googleButtonText: { color: "#111827" },
  tip: { marginTop: 10, textAlign: "center", color: "#9ca3af", fontSize: 12 },
});

