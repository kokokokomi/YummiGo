import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

/**
 * Expo は `.env.development` を自動ロードして値を上書きすることがあるため、
 * API の切替は「環境フラグ」で決定し、`.env` の影響を受けにくくする。
 */
export const APP_ENV =
  process.env.EXPO_PUBLIC_APP_ENV ||
  extra.EXPO_PUBLIC_APP_ENV ||
  "local";

const API_BASE_URL_BY_ENV: Record<string, string> = {
  local: "http://localhost:8080",
  server: "http://13.113.53.71",
};

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  extra.EXPO_PUBLIC_API_BASE_URL ||
  API_BASE_URL_BY_ENV[APP_ENV] ||
  "http://13.113.53.71";

if (__DEV__) {
  console.log("[ENV] APP_ENV =", APP_ENV);
  console.log("[ENV] API_BASE_URL =", API_BASE_URL);
  console.log(
    "[ENV] EXPO_PUBLIC_API_BASE_URL(process.env) =",
    process.env.EXPO_PUBLIC_API_BASE_URL
  );
}

export const GOOGLE_WEB_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  extra.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ||
  "";

export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  extra.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ||
  "";

export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  extra.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ||
  "";

export const GOOGLE_EXPO_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
  extra.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ||
  "";

