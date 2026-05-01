import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";

import { getDishCategories, getDishList, getDishWithFlavor } from "@/src/api/catalog";
import type { Category, DishFlavor, DishVO } from "@/src/types/api";
import { useCart } from "@/src/state/cart";

export default function MenuScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [dishes, setDishes] = useState<DishVO[]>([]);
  const [flavorVisible, setFlavorVisible] = useState(false);
  const [flavorDish, setFlavorDish] = useState<DishVO | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Record<string, string>>({});
  const [cartVisible, setCartVisible] = useState(false);
  const { items, totalAmount, totalCount, addItem, subItem, clearAll } = useCart();
  const cartModalHeight = useMemo(() => {
    // 中文注释：购物车详情最多占屏幕 30%，商品少时按内容自适应
    const maxHeight = Math.floor(screenHeight * 0.3);
    const headerAndBottom = 92;
    const rowHeight = 58;
    const expected = headerAndBottom + items.length * rowHeight;
    const minHeight = 140;
    return Math.max(minHeight, Math.min(expected, maxHeight));
  }, [items.length, screenHeight]);

  const selectedCategoryName = useMemo(
    () => categories.find((c) => String(c.id) === selectedCategoryId)?.name ?? "",
    [categories, selectedCategoryId]
  );

  const loadCategories = async () => {
    const list = await getDishCategories();
    setCategories(list);
    if (list.length > 0) {
      setSelectedCategoryId(String(list[0].id));
      return String(list[0].id);
    }
    return "";
  };

  const loadDishes = async (categoryId: string) => {
    if (!categoryId) return;
    const list = await getDishList(categoryId);
    setDishes(list);
  };

  const bootstrap = useCallback(async () => {
    setLoading(true);
    try {
      const categoryId = await loadCategories();
      await loadDishes(categoryId);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    bootstrap();
  }, [bootstrap]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await bootstrap();
    } finally {
      setRefreshing(false);
    }
  };

  const onSelectCategory = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    try {
      await loadDishes(categoryId);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "メニュー取得に失敗しました");
    }
  };

  const onAddDish = async (dish: DishVO) => {
    try {
      const detail = await getDishWithFlavor(String(dish.id));
      const flavors = detail?.flavors || [];
      if (flavors.length > 0) {
        setFlavorDish(detail);
        setSelectedFlavor({});
        setFlavorVisible(true);
        return;
      }
      await addItem({ dishId: String(dish.id) });
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "カート追加に失敗しました");
    }
  };

  // 中文注释：后端 flavor.value 常见是 JSON 数组或逗号分隔字符串，这里统一做兼容解析
  const parseFlavorOptions = (flavor: DishFlavor) => {
    const raw = flavor?.value ?? "";
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      // ignore parse error
    }
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const onConfirmFlavor = async () => {
    if (!flavorDish) return;
    const flavors = flavorDish.flavors || [];
    const missing = flavors.find((f) => !selectedFlavor[f.name]);
    if (missing) {
      Alert.alert("選択してください", `${missing.name} を選択してください`);
      return;
    }
    const dishFlavor = flavors
      .map((f) => `${f.name}:${selectedFlavor[f.name]}`)
      .join(",");
    try {
      await addItem({ dishId: String(flavorDish.id), dishFlavor });
      setFlavorVisible(false);
      setFlavorDish(null);
      setSelectedFlavor({});
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "カート追加に失敗しました");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.categoryWrap}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={(item) => String(item.id)}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = String(item.id) === selectedCategoryId;
            return (
              <Pressable
                onPress={() => onSelectCategory(String(item.id))}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
              >
                <Text style={[styles.categoryText, active && styles.categoryTextActive]}>{item.name}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <Text style={styles.sectionTitle}>{selectedCategoryName || "メニュー"}</Text>

      <FlatList
        data={dishes}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: 84 }]}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.image} /> : <View style={styles.imagePlaceholder} />}
            <View style={styles.cardBody}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description || "説明なし"}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>¥{Number(item.price).toFixed(0)}</Text>
                <Pressable style={styles.addBtn} onPress={() => onAddDish(item)}>
                  <Text style={styles.addBtnText}>追加</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      />

      <View style={styles.cartBar}>
        <Pressable style={styles.cartLeft} onPress={() => setCartVisible(true)}>
          <View style={styles.cartIconWrap}>
            <MaterialIcons name="shopping-cart" size={24} color="#fff" />
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{totalCount}</Text>
            </View>
          </View>
          <View>
            <Text style={styles.cartAmount}>¥{totalAmount.toFixed(0)}</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.checkoutBtn, totalCount === 0 && { opacity: 0.6 }]}
          disabled={totalCount === 0}
          onPress={() => router.push("/order/confirm")}
        >
          <Text style={styles.checkoutBtnText}>注文へ進む</Text>
        </Pressable>
      </View>

      <Modal visible={cartVisible} transparent animationType="slide" onRequestClose={() => setCartVisible(false)}>
        <View style={styles.modalMask}>
          <View style={[styles.cartModalCard, { height: cartModalHeight }]}>
            <View style={styles.cartModalHeader}>
              <Text style={styles.modalTitle}>カート詳細</Text>
              <Pressable onPress={() => setCartVisible(false)} style={styles.collapseBtn}>
                <MaterialIcons name="keyboard-arrow-down" size={24} color="#111827" />
              </Pressable>
            </View>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.id)}
              contentContainerStyle={{ paddingBottom: 60 }}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  {item.image ? <Image source={{ uri: item.image }} style={styles.cartItemImage} /> : <View style={styles.cartItemImage} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemSub}>{item.dishFlavor || "-"}</Text>
                    <Text style={styles.cartItemPrice}>¥{Number(item.amount).toFixed(0)}</Text>
                  </View>
                  <View style={styles.qtyActions}>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        subItem({
                          dishId: item.dishId ? String(item.dishId) : undefined,
                          setmealId: item.setmealId ? String(item.setmealId) : undefined,
                          dishFlavor: item.dishFlavor,
                        })
                      }
                    >
                      <Text>-</Text>
                    </Pressable>
                    <Text style={styles.qtyText}>{item.number}</Text>
                    <Pressable
                      style={styles.qtyBtn}
                      onPress={() =>
                        addItem({
                          dishId: item.dishId ? String(item.dishId) : undefined,
                          setmealId: item.setmealId ? String(item.setmealId) : undefined,
                          dishFlavor: item.dishFlavor,
                        })
                      }
                    >
                      <Text>+</Text>
                    </Pressable>
                  </View>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>カートは空です</Text>}
            />
            <View style={styles.cartModalBottom}>
              <Pressable onPress={clearAll}>
                <Text style={styles.clearText}>クリア</Text>
              </Pressable>
              <Text style={styles.modalTotal}>合計 ¥{totalAmount.toFixed(0)}</Text>
              <Pressable
                style={[styles.modalPayBtn, totalCount === 0 && { opacity: 0.6 }]}
                disabled={totalCount === 0}
                onPress={() => {
                  setCartVisible(false);
                  router.push("/order/confirm");
                }}
              >
                <Text style={styles.modalPayText}>支払いへ</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={flavorVisible} transparent animationType="slide" onRequestClose={() => setFlavorVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>味を選択</Text>
            <Text style={styles.modalDishName}>{flavorDish?.name}</Text>
            <ScrollView style={{ maxHeight: 280 }}>
              {(flavorDish?.flavors || []).map((flavor) => {
                const options = parseFlavorOptions(flavor);
                return (
                  <View key={String(flavor.id)} style={{ marginTop: 12 }}>
                    <Text style={styles.flavorLabel}>{flavor.name}</Text>
                    <View style={styles.flavorOptions}>
                      {options.map((opt) => {
                        const active = selectedFlavor[flavor.name] === opt;
                        return (
                          <Pressable
                            key={opt}
                            style={[styles.flavorChip, active && styles.flavorChipActive]}
                            onPress={() =>
                              setSelectedFlavor((prev) => ({ ...prev, [flavor.name]: opt }))
                            }
                          >
                            <Text style={[styles.flavorChipText, active && styles.flavorChipTextActive]}>
                              {opt}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setFlavorVisible(false)}>
                <Text style={styles.modalCancelText}>キャンセル</Text>
              </Pressable>
              <Pressable style={[styles.modalBtn, styles.modalConfirm]} onPress={onConfirmFlavor}>
                <Text style={styles.modalConfirmText}>追加</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  categoryWrap: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#eef2ff",
    marginRight: 8,
  },
  categoryChipActive: { backgroundColor: "#2563eb" },
  categoryText: { color: "#1f2937", fontSize: 13, fontWeight: "600" },
  categoryTextActive: { color: "#fff" },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#111827", margin: 14 },
  listContent: { paddingHorizontal: 12, paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  image: { width: "100%", height: 160, resizeMode: "cover" },
  imagePlaceholder: { width: "100%", height: 160, backgroundColor: "#e5e7eb" },
  cardBody: { padding: 12, gap: 8 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  desc: { fontSize: 13, color: "#6b7280" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { fontSize: 16, fontWeight: "700", color: "#dc2626" },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  cartBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#111827",
    borderRadius: 0,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cartLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  cartIconWrap: { width: 28, height: 28, alignItems: "center", justifyContent: "center" },
  badge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -4,
    right: -6,
    paddingHorizontal: 3,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  cartAmount: { color: "#fff", fontSize: 16, fontWeight: "700" },
  checkoutBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 16, paddingVertical: 10 },
  checkoutBtnText: { color: "#fff", fontWeight: "700" },
  cartModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    height: "30%",
    paddingTop: 8,
    paddingHorizontal: 12,
  },
  cartModalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  collapseBtn: { padding: 4 },
  clearText: { color: "#ef4444", fontWeight: "700" },
  cartItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    paddingVertical: 6,
  },
  cartItemImage: { width: 34, height: 34, borderRadius: 8, backgroundColor: "#e5e7eb" },
  cartItemName: { color: "#111827", fontWeight: "700", fontSize: 12 },
  cartItemSub: { color: "#6b7280", fontSize: 11 },
  cartItemPrice: { color: "#dc2626", fontSize: 12, fontWeight: "700" },
  qtyActions: { flexDirection: "row", alignItems: "center", gap: 6 },
  qtyBtn: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  qtyText: { minWidth: 14, textAlign: "center" },
  emptyText: { textAlign: "center", color: "#9ca3af", marginTop: 12 },
  cartModalBottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTotal: { color: "#111827", fontWeight: "700" },
  modalPayBtn: { backgroundColor: "#2563eb", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  modalPayText: { color: "#fff", fontWeight: "700" },
  modalMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    paddingBottom: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalDishName: { marginTop: 4, color: "#6b7280" },
  flavorLabel: { fontWeight: "700", color: "#374151", marginBottom: 8 },
  flavorOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flavorChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
  },
  flavorChipActive: { backgroundColor: "#2563eb" },
  flavorChipText: { color: "#1f2937" },
  flavorChipTextActive: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 10 },
  modalCancel: { backgroundColor: "#f3f4f6" },
  modalConfirm: { backgroundColor: "#2563eb" },
  modalCancelText: { color: "#374151", fontWeight: "700" },
  modalConfirmText: { color: "#fff", fontWeight: "700" },
});
