import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { addToCart, cleanCart, getCartList, subFromCart } from "@/src/api/cart";
import type { ShoppingCartItem } from "@/src/types/api";

type CartContextType = {
  items: ShoppingCartItem[];
  loading: boolean;
  totalAmount: number;
  totalCount: number;
  refresh: () => Promise<void>;
  addItem: (payload: { dishId?: string; setmealId?: string; dishFlavor?: string }) => Promise<void>;
  subItem: (payload: { dishId?: string; setmealId?: string; dishFlavor?: string }) => Promise<void>;
  clearAll: () => Promise<void>;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ShoppingCartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getCartList();
      setItems(list || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const addItem = useCallback(async (payload: { dishId?: string; setmealId?: string; dishFlavor?: string }) => {
    await addToCart(payload);
    await refresh();
  }, [refresh]);

  const subItem = useCallback(async (payload: { dishId?: string; setmealId?: string; dishFlavor?: string }) => {
    await subFromCart(payload);
    await refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await cleanCart();
    await refresh();
  }, [refresh]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + Number(item.amount) * Number(item.number), 0),
    [items]
  );
  const totalCount = useMemo(() => items.reduce((sum, item) => sum + Number(item.number), 0), [items]);

  const value = useMemo<CartContextType>(
    () => ({ items, loading, totalAmount, totalCount, refresh, addItem, subItem, clearAll }),
    [items, loading, totalAmount, totalCount, refresh, addItem, subItem, clearAll]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}

