import { apiGet } from "@/src/lib/http";
import type { Category, DishVO, Setmeal } from "@/src/types/api";

export function getDishCategories() {
  return apiGet<Category[]>("/category/list", { type: 1 });
}

export function getSetmealCategories() {
  return apiGet<Category[]>("/category/list", { type: 2 });
}

export function getDishList(categoryId: string) {
  return apiGet<DishVO[]>("/dish/list", { categoryId });
}

export function getDishWithFlavor(dishId: string) {
  return apiGet<DishVO>("/dish/getDishWithFlavor", { dishId });
}

export function getSetmealList(categoryId: string) {
  return apiGet<Setmeal[]>("/setmeal/list", { categoryId });
}

