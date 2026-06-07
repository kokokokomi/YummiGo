import { router, type Href } from "expo-router";

/** EAS Update 下 router.back() 不可靠，统一 replace 到上级页 */
export function navigateBack(fallback: Href) {
  router.replace(fallback);
}

export const STACK_BACK_FALLBACKS: Record<string, Href> = {
  "order/confirm": "/(tabs)",
  "order/detail": "/(tabs)/orders",
  "profile/edit": "/(tabs)/profile",
  "profile/password": "/profile/edit",
  "profile/address": "/(tabs)/profile",
  "payment/success": "/(tabs)/orders",
  "payment/cancel": "/(tabs)/orders",
  "+not-found": "/(tabs)",
};
