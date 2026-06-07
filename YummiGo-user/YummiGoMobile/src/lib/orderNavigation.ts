import { router } from "expo-router";

import { navigateBack } from "@/src/lib/navigation";

type OrderDetailNavParams = {
  countdownStart?: string | number;
  fromCancel?: string;
};

/** 支付/下单后进入订单详情，并避免返回落到空的注文確認页 */
export function navigateToOrderDetail(orderId: string, params?: OrderDetailNavParams) {
  const query = new URLSearchParams({ id: String(orderId) });
  if (params?.countdownStart != null) {
    query.set("countdownStart", String(params.countdownStart));
  }
  if (params?.fromCancel) {
    query.set("fromCancel", params.fromCancel);
  }

  router.replace("/(tabs)/orders");
  router.push(`/order/detail?${query.toString()}`);
}

/** 订单详情返回订单列表 */
export function navigateBackToOrders() {
  navigateBack("/(tabs)/orders");
}
