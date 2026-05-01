import { apiDelete, apiGet, apiPost } from "@/src/lib/http";
import type { ShoppingCartItem } from "@/src/types/api";

type AddCartPayload = {
  dishId?: string;
  setmealId?: string;
  dishFlavor?: string;
};

export function addToCart(payload: AddCartPayload) {
  return apiPost<void>("/shoppingCart/add", payload);
}

export function subFromCart(payload: AddCartPayload) {
  return apiPost<void>("/shoppingCart/sub", payload);
}

export function getCartList() {
  return apiGet<ShoppingCartItem[]>("/shoppingCart/list");
}

export function cleanCart() {
  return apiDelete<void>("/shoppingCart/clean");
}

