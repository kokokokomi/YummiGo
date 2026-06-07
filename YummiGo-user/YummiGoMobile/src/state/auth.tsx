import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import * as AuthSession from "expo-auth-session";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import { router } from "expo-router";
import { Alert, Platform } from "react-native";

import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_EXPO_CLIENT_ID,
  GOOGLE_IOS_CLIENT_ID,
  GOOGLE_USE_EXPO_PROXY,
  GOOGLE_WEB_CLIENT_ID,
} from "@/src/config/env";
import { clearToken, getToken, setToken } from "@/src/lib/storage";
import { getUserInfo, loginByGoogle, loginByPassword } from "@/src/api/user";

WebBrowser.maybeCompleteAuthSession();

const EXPO_PROXY_PROJECT = "@kokokokomi/YummiGoMobile";
const EXPO_PROXY_REDIRECT_URI = `https://auth.expo.io/${EXPO_PROXY_PROJECT}`;

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

function resolveWebClientId() {
  return GOOGLE_WEB_CLIENT_ID || GOOGLE_EXPO_CLIENT_ID || "";
}

function resolveAppReturnUrl() {
  // EAS Update / Expo Go 会生成 exp://u.expo.dev/... ；独立 App 则是 yummigo://
  return Linking.createURL("expo-auth-session");
}

function extractGoogleIdToken(response: AuthSession.AuthSessionResult | null) {
  if (!response || response.type !== "success") return "";
  return response.params?.id_token || response.authentication?.idToken || "";
}

function buildExpoProxyStartUrl(authUrl: string, appReturnUrl: string) {
  const query = new URLSearchParams({
    authUrl,
    returnUrl: appReturnUrl,
  });
  return `${EXPO_PROXY_REDIRECT_URI}/start?${query.toString()}`;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const googleLoginPendingRef = useRef(false);

  const isExpoGo = Constants.appOwnership === "expo";
  const useExpoProxy =
    GOOGLE_USE_EXPO_PROXY && Platform.OS !== "web" && (isExpoGo || Constants.appOwnership !== "expo");
  const webClientId = resolveWebClientId();
  const platformClientId = useExpoProxy
    ? webClientId
    : Platform.OS === "ios"
    ? GOOGLE_IOS_CLIENT_ID || webClientId
    : Platform.OS === "android"
    ? GOOGLE_ANDROID_CLIENT_ID || webClientId
    : webClientId;
  const appReturnUrl = resolveAppReturnUrl();
  const redirectUri = useExpoProxy
    ? EXPO_PROXY_REDIRECT_URI
    : AuthSession.makeRedirectUri({
        scheme: "yummigo",
        path: "oauthredirect",
        native: "yummigo://oauthredirect",
      });

  const googleClientConfig = useExpoProxy
    ? {
        expoClientId: GOOGLE_EXPO_CLIENT_ID || webClientId || undefined,
        webClientId: webClientId || undefined,
        iosClientId: webClientId || undefined,
        androidClientId: webClientId || undefined,
      }
    : {
        expoClientId: GOOGLE_EXPO_CLIENT_ID || webClientId || undefined,
        webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
        iosClientId: GOOGLE_IOS_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
        androidClientId: GOOGLE_ANDROID_CLIENT_ID || GOOGLE_WEB_CLIENT_ID || undefined,
      };

  const [request, response, promptAsync] = Google.useAuthRequest({
    ...googleClientConfig,
    redirectUri,
    responseType: "id_token",
    selectAccount: true,
    scopes: ["openid", "profile", "email"],
  });

  const processGoogleResponse = useCallback(async (next: AuthSession.AuthSessionResult | null) => {
    if (!next) return;

    if (__DEV__) {
      console.log("[Google OAuth] response.type =", next.type);
      if (next.type === "success") {
        console.log("[Google OAuth] response.params =", next.params);
        console.log("[Google OAuth] response.url =", next.url);
      }
    }

    if (next.type === "success") {
      const idToken = extractGoogleIdToken(next);
      if (!idToken) {
        if (googleLoginPendingRef.current) {
          googleLoginPendingRef.current = false;
          const keys = Object.keys(next.params || {}).join(", ") || "(empty)";
          Alert.alert(
            "Google認証",
            __DEV__
              ? `認証は完了しましたが id_token が取得できませんでした。\nparams: ${keys}`
              : "認証は完了しましたが、ログイン情報の取得に失敗しました。"
          );
        }
        return;
      }

      googleLoginPendingRef.current = false;
      try {
        const data = await loginByGoogle(idToken);
        await setToken(data.token);
        setTokenState(data.token);
        const me = await getUserInfo();
        setProfile(me);
        router.replace("/(tabs)");
      } catch (e: any) {
        Alert.alert("Googleログイン失敗", e?.message || "サーバーでの認証に失敗しました");
      }
      return;
    }

    if (!googleLoginPendingRef.current) return;
    if (next.type === "cancel" || next.type === "dismiss" || next.type === "opened") {
      googleLoginPendingRef.current = false;
      return;
    }

    if (next.type === "error") {
      googleLoginPendingRef.current = false;
      const detail =
        next.error?.message ||
        next.params?.error_description ||
        next.params?.error ||
        "Googleログインに失敗しました。";
      Alert.alert("Google認証失敗", detail);
    }
  }, []);

  useEffect(() => {
    if (__DEV__) {
      console.log("[Google OAuth] appOwnership =", Constants.appOwnership);
      console.log("[Google OAuth] linkingUri =", Constants.linkingUri);
      console.log("[Google OAuth] useExpoProxy =", useExpoProxy);
      console.log("[Google OAuth] redirectUri (Google) =", redirectUri);
      console.log("[Google OAuth] appReturnUrl (App) =", appReturnUrl);
      console.log("[Google OAuth] clientId =", platformClientId || "(empty)");
      if (request?.url) {
        console.log("[Google OAuth] authUrl =", request.url);
      }
    }
  }, [redirectUri, appReturnUrl, useExpoProxy, platformClientId, request?.url]);

  useEffect(() => {
    (async () => {
      try {
        const saved = await getToken();
        if (!saved) return;
        // token は storage に残っているので API は呼べる。成功してから state に反映する
        try {
          const me = await getUserInfo();
          setTokenState(saved);
          setProfile(me);
        } catch {
          await clearToken();
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // 代理モードでは手動で処理する。hook の response は起動時の誤検知を避ける
  useEffect(() => {
    if (useExpoProxy || !response) return;
    processGoogleResponse(response);
  }, [response, processGoogleResponse, useExpoProxy]);

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
          Alert.alert(
            "Googleログイン準備中",
            "認証リクエストの初期化中です。1秒後にもう一度お試しください。"
          );
          return;
        }
        if (!platformClientId) {
          Alert.alert(
            "Google設定不足",
            "EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID を設定してください。"
          );
          return;
        }

        try {
          googleLoginPendingRef.current = true;

          if (useExpoProxy) {
            const authUrl = request.url;
            if (!authUrl) {
              throw new Error("Google 認証 URL の生成に失敗しました。");
            }

            const proxyStartUrl = buildExpoProxyStartUrl(authUrl, appReturnUrl);
            if (__DEV__) {
              console.log("[Google OAuth] proxyStartUrl =", proxyStartUrl);
            }

            const browserResult = await WebBrowser.openAuthSessionAsync(
              proxyStartUrl,
              appReturnUrl
            );

            if (browserResult.type === "success" && browserResult.url) {
              const parsed = request.parseReturnUrl(browserResult.url);
              await processGoogleResponse(parsed);
              return;
            }

            await processGoogleResponse({ type: browserResult.type } as AuthSession.AuthSessionResult);
            return;
          }

          await promptAsync();
        } catch (e: any) {
          googleLoginPendingRef.current = false;
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
    [
      token,
      profile,
      loading,
      request,
      promptAsync,
      useExpoProxy,
      appReturnUrl,
      platformClientId,
      processGoogleResponse,
    ]
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
