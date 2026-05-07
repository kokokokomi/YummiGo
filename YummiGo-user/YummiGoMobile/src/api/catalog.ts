import { apiGet } from "@/src/lib/http";
import type { Category, DishItemVO, DishVO, Setmeal } from "@/src/types/api";

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

export function getSetmealById(setmealId: string) {
  return apiGet<Setmeal>(`/setmeal/${setmealId}`);
}

export function getDishById(dishId: string) {
  return apiGet<DishVO>(`/dish/${dishId}`);
}

// 按套餐 id 查询套餐包含的料理明细
export function getSetmealDishItems(setmealId: string) {
  return apiGet<DishItemVO[]>(`/setmeal/dish/${setmealId}`);
}

