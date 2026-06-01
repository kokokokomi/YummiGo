import { Alert } from "react-native";
import type { OrderVO } from "@/src/types/api";

/** 仅商家拒单原因（用户自行取消只有 cancelReason，不弹拒单窗） */
export function getMerchantRejectReason(order?: Pick<OrderVO, "rejectionReason"> | null) {
  return order?.rejectionReason?.trim() || "";
}

export function showMerchantRejectAlert(reason: string) {
  Alert.alert(
    "店舗により拒否されました",
    reason || "店舗都合により注文をお受けできませんでした。",
    [{ text: "OK" }]
  );
}

/** 受付待ち(2) → キャンセル(6) 且商家填写了拒单原因时提示 */
export function shouldNotifyMerchantReject(prevStatus: number | undefined, order: OrderVO) {
  if (order.status !== 6 || prevStatus !== 2) return false;
  return Boolean(getMerchantRejectReason(order));
}
