import Constants from "expo-constants";

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  extra.EXPO_PUBLIC_API_BASE_URL ||
  "http://localhost:8080";

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

