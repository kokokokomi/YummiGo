import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import { router } from "expo-router";
import { Alert, Platform } from "react-native";

import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_EXPO_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_WEB_CLIENT_ID,
} from "@/src/config/env";
import { clearToken, getToken, setToken } from "@/src/lib/storage";
import { getUserInfo, loginByGoogle, loginByPassword } from "@/src/api/user";

WebBrowser.maybeCompleteAuthSession();

type AuthContextType = {
  token: string | null;
  profile: any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const isExpoGo = Constants.appOwnership === "expo";
  const useProxy = Platform.OS !== "web" && isExpoGo;
  const expoProxyProject = "@kokokokomi/YummiGoMobile";
  const expoProxyRedirectUri = `https://auth.expo.io/${expoProxyProject}`;
  const expoClientId = GOOGLE_EXPO_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined;
  const platformClientId =
    Platform.OS === "ios"
      ? GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || GOOGLE_EXPO_CLIENT_ID || ""
      : Platform.OS === "android"
      ? GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || GOOGLE_EXPO_CLIENT_ID || ""
      : GOOGLE_WEB_CLIENT_ID || GOOGLE_EXPO_CLIENT_ID || "";
  const redirectUri = useProxy
    ? expoProxyRedirectUri
    : AuthSession.makeRedirectUri({
        scheme: "yummigo",
      });

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId,
    webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
    iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
    androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
    redirectUri,
    responseType: "id_token",
    scopes: ["openid", "profile", "email"],
  });

  useEffect(() => {
    (async () => {
      try {
        const saved = await getToken();
        if (saved) {
          setTokenState(saved);
          const me = await getUserInfo();
          setProfile(me);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (response?.type !== "success") return;
    const idToken = response.authentication?.idToken;
    if (!idToken) return;
    (async () => {
      const data = await loginByGoogle(idToken);
      await setToken(data.token);
      setTokenState(data.token);
      const me = await getUserInfo();
      setProfile(me);
      router.replace("/(tabs)");
    })().catch(console.error);
  }, [response]);

  useEffect(() => {
    if (!response || response.type === "success") return;
    Alert.alert("Google認証失敗", "Googleログインに失敗しました。しばらくして再度お試しください。");
  }, [response, redirectUri, platformClientId]);

  const value = useMemo<AuthContextType>(
    () => ({
      token,
      profile,
      loading,
      async login(email: string, password: string) {
        const data = await loginByPassword(email, password);
        await setToken(data.token);
        setTokenState(data.token);
        const me = await getUserInfo();
        setProfile(me);
      },
      async loginWithGoogle() {
        if (!request) {
          Alert.alert("Googleログイン準備中", "認証リクエストの初期化中です。1秒後にもう一度お試しください。");
          return;
        }
        if (!platformClientId) {
          Alert.alert("Google設定不足", "Google Client ID を設定してください。");
          return;
        }
        try {
          await promptAsync({
            useProxy,
            projectNameForProxy: expoProxyProject,
          } as any);
        } catch (e: any) {
          Alert.alert("Googleログインエラー", e?.message || "Google OAuth の開始に失敗しました。");
        }
      },
      async logout() {
        await clearToken();
        setTokenState(null);
        setProfile(null);
      },
      async reloadProfile() {
        if (!token) return;
        const me = await getUserInfo();
        setProfile(me);
      },
    }),
    [token, profile, loading, request, promptAsync, redirectUri, useProxy, platformClientId]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
