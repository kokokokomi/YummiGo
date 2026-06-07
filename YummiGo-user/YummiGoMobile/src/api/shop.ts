import { apiGet } from "@/src/lib/http";

/** 1=営業中 0=閉店 */
export function getShopStatus() {
  return apiGet<number>("/shop/status");
}
