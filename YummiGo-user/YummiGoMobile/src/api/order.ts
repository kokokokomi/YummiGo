import { apiGet, apiPost, apiPut } from "@/src/lib/http";
import type {
  OrderPaymentStatusVO,
  OrderPaymentVO,
  OrderSubmitVO,
  OrderVO,
  PageResult,
} from "@/src/types/api";

export type SubmitOrderPayload = {
  addressBookId: string;
  payMethod: number;
  remark?: string;
  estimatedDeliveryTime?: string;
  deliveryStatus: number;
  tablewareNumber: number;
  tablewareStatus: number;
  packAmount: number;
  amount: number;
};

export function submitOrder(payload: SubmitOrderPayload) {
  return apiPost<OrderSubmitVO>("/order/submit", payload);
}

export function createOrderPayment(payload: {
  payMethod: number;
  orderId: string;
  currency: string;
  orderNumber: string;
  amountInCents: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}) {
  return apiPost<OrderPaymentVO>("/order/payment", payload);
}

export function confirmPayment(sessionId: string) {
  return apiGet<OrderPaymentStatusVO>("/order/payment/complete", { session_id: sessionId });
}

export function getOrderPage(page: number, pageSize = 10, status?: number) {
  return apiGet<PageResult<OrderVO>>("/order/page", { page, pageSize, status });
}

export function getOrderById(id: string) {
  return apiGet<OrderVO>(`/order/${id}`);
}

export function cancelOrder(id: string, cancelReason = "用户取消") {
  return apiPut<void>(`/order/cancel/${id}`, { cancelReason } as any);
}

