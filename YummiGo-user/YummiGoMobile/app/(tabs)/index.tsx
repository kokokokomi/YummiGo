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

import {
  getDishCategories,
  getDishList,
  getDishWithFlavor,
  getSetmealById,
  getSetmealCategories,
  getSetmealDishItems,
  getSetmealList,
} from "@/src/api/catalog";
import type { Category, DishFlavor, DishVO, Setmeal } from "@/src/types/api";
import { useCart } from "@/src/state/cart";
import { API_BASE_URL } from "@/src/config/env";

type MenuKind = "dish" | "setmeal";
type MenuItem = (DishVO | Setmeal) & { _kind: MenuKind };
type SetmealDishDisplay = {
  id: string;
  name: string;
  copies: number;
  unitPrice: number;
  image?: string;
  description?: string;
};

export default function MenuScreen() {
  const { height: screenHeight } = useWindowDimensions();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [menuKind, setMenuKind] = useState<MenuKind>("dish");
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("");
  const [menuList, setMenuList] = useState<MenuItem[]>([]);
  const [flavorVisible, setFlavorVisible] = useState(false);
  const [flavorDish, setFlavorDish] = useState<DishVO | null>(null);
  const [selectedFlavor, setSelectedFlavor] = useState<Record<string, string>>({});
  const [setmealVisible, setSetmealVisible] = useState(false);
  const [setmealDetail, setSetmealDetail] = useState<Setmeal | null>(null);
  const [setmealDishList, setSetmealDishList] = useState<SetmealDishDisplay[]>([]);
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
  const getUnitPrice = (amount: number, count: number) => {
    const n = Number(count) || 1;
    return Number(amount) / n;
  };
  const resolveImage = (path?: string) => {
    if (!path) return "";
    if (/^(https?:)?\/\//.test(path) || path.startsWith("data:")) return path;
    return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
  };
  const getSetmealOriginalPrice = (setmeal: Setmeal | null) => {
    if (setmealDishList.length > 0) {
      return setmealDishList.reduce((sum, dish) => sum + Number(dish.unitPrice || 0) * Number(dish.copies || 0), 0);
    }
    if (!setmeal?.setmealDishes?.length) return Number(setmeal?.price || 0);
    return setmeal.setmealDishes.reduce((sum, dish) => {
      return sum + Number(dish.price || 0) * Number(dish.copies || 0);
    }, 0);
  };

  const loadCategories = async (kind: MenuKind) => {
    const list = kind === "dish" ? await getDishCategories() : await getSetmealCategories();
    setCategories(list);
    if (list.length > 0) {
      setSelectedCategoryId(String(list[0].id));
      return String(list[0].id);
    }
    return "";
  };

  const loadMenus = async (kind: MenuKind, categoryId: string) => {
    if (!categoryId) return;
    if (kind === "dish") {
      const list = await getDishList(categoryId);
      setMenuList((list || []).map((item) => ({ ...item, _kind: "dish" })));
      return;
    }
    const list = await getSetmealList(categoryId);
    setMenuList((list || []).map((item) => ({ ...item, _kind: "setmeal" })));
  };

  const bootstrap = useCallback(async (kind: MenuKind = menuKind) => {
    setLoading(true);
    try {
      const categoryId = await loadCategories(kind);
      await loadMenus(kind, categoryId);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  }, [menuKind]);

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
      await loadMenus(menuKind, categoryId);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "メニュー取得に失敗しました");
    }
  };

  const onAddMenu = async (item: MenuItem) => {
    if (item._kind === "setmeal") {
      try {
        await addItem({ setmealId: String(item.id) });
      } catch (e: any) {
        Alert.alert("エラー", e?.message || "カート追加に失敗しました");
      }
      return;
    }
    const dish = item as DishVO;
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

  const onOpenSetmealDetail = async (setmeal: Setmeal) => {
    setSetmealDetail(setmeal);
    setSetmealVisible(true);
    setSetmealDishList([]);
    try {
      const safeSetmealId = String(setmeal.id).trim();
      const [dishItems, setmealFull] = await Promise.all([
        getSetmealDishItems(safeSetmealId),
        getSetmealById(safeSetmealId).catch(() => null),
      ]);
      const setmealConfigDishes = (setmealFull?.setmealDishes?.length ? setmealFull.setmealDishes : setmeal.setmealDishes) || [];
      const normalizeName = (name?: string) => String(name || "").trim().toLowerCase();
      const detailByDishId = new Map((dishItems || []).map((dish) => [String(dish.dishId || ""), dish]));
      const detailByName = new Map((dishItems || []).map((dish) => [normalizeName(dish.name), dish]));
      const seenKeys = new Set<string>();
      // 以商家保存的套餐配置为唯一真源，避免 /setmeal/dish 返回重复时出现 a+a+b
      const detailedFromConfig = setmealConfigDishes
        .map((configDish, idx) => {
          const dishIdKey = String(configDish.dishId || "").trim();
          const nameKey = normalizeName(configDish.name);
          const key = nameKey || dishIdKey || String(idx);
          if (seenKeys.has(key)) return null;
          seenKeys.add(key);
          const matchedDetail =
            detailByDishId.get(dishIdKey) || detailByName.get(nameKey);
          return {
            id: String(configDish.dishId || idx),
            name: configDish.name,
            copies: Number(configDish.copies || 1),
            unitPrice: Number(configDish.price || 0),
            image: matchedDetail?.image,
            description: matchedDetail?.description,
          } as SetmealDishDisplay;
        })
        .filter((item): item is SetmealDishDisplay => Boolean(item));
      const detailedFallback = (dishItems || []).map((dish, idx) => ({
        id: String(dish.dishId || idx),
        name: dish.name,
        copies: Number(dish.copies || 1),
        unitPrice: Number(dish.price || 0),
        image: dish.image,
        description: dish.description,
      })) as SetmealDishDisplay[];
      setSetmealDishList(detailedFromConfig.length > 0 ? detailedFromConfig : detailedFallback);
      if (setmealFull) {
        setSetmealDetail(setmealFull);
      }
    } catch (e: any) {
      setSetmealDishList([]);
      Alert.alert("お知らせ", e?.message || "セット内訳の取得に失敗しました。基本情報のみ表示しています。");
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
      <View style={styles.modeTabs}>
        <Pressable
          style={[styles.modeTab, menuKind === "dish" && styles.modeTabActive]}
          onPress={async () => {
            if (menuKind === "dish") return;
            setMenuKind("dish");
            await bootstrap("dish");
          }}
        >
          <Text style={[styles.modeTabText, menuKind === "dish" && styles.modeTabTextActive]}>料理</Text>
        </Pressable>
        <Pressable
          style={[styles.modeTab, menuKind === "setmeal" && styles.modeTabActive]}
          onPress={async () => {
            if (menuKind === "setmeal") return;
            setMenuKind("setmeal");
            await bootstrap("setmeal");
          }}
        >
          <Text style={[styles.modeTabText, menuKind === "setmeal" && styles.modeTabTextActive]}>セット</Text>
        </Pressable>
      </View>
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

      <Text style={styles.sectionTitle}>{selectedCategoryName || (menuKind === "dish" ? "料理メニュー" : "セットメニュー")}</Text>

      <FlatList
        data={menuList}
        keyExtractor={(item) => String(item.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={[styles.listContent, { paddingBottom: 84 }]}
        renderItem={({ item }) => (
          <View style={styles.card}>
            {item.image ? <Image source={{ uri: resolveImage(item.image) }} style={styles.image} /> : <View style={styles.imagePlaceholder} />}
            <View style={styles.cardBody}>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Text style={styles.name}>{item.name}</Text>
                {item._kind === "setmeal" && <Text style={styles.setmealTag}>セット</Text>}
              </View>
              <Text style={styles.desc} numberOfLines={2}>
                {item.description || "説明なし"}
              </Text>
              <View style={styles.footer}>
                <Text style={styles.price}>¥{Number(item.price).toFixed(0)}</Text>
                {item._kind === "setmeal" ? (
                  <View style={styles.setmealActions}>
                    <Pressable style={styles.detailBtn} onPress={() => onOpenSetmealDetail(item as Setmeal)}>
                      <Text style={styles.detailBtnText}>詳細</Text>
                    </Pressable>
                    <Pressable style={styles.addBtn} onPress={() => onAddMenu(item)}>
                      <Text style={styles.addBtnText}>追加</Text>
                    </Pressable>
                  </View>
                ) : (
                  <Pressable style={styles.addBtn} onPress={() => onAddMenu(item)}>
                    <Text style={styles.addBtnText}>追加</Text>
                  </Pressable>
                )}
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
                  {item.image ? <Image source={{ uri: resolveImage(item.image) }} style={styles.cartItemImage} /> : <View style={styles.cartItemImage} />}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemSub}>{item.dishFlavor || "-"}</Text>
                    <Text style={styles.cartItemPrice}>¥{getUnitPrice(Number(item.amount), Number(item.number)).toFixed(0)}</Text>
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
      <Modal visible={setmealVisible} transparent animationType="slide" onRequestClose={() => setSetmealVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            {setmealDetail?.image ? (
              <Image source={{ uri: resolveImage(setmealDetail.image) }} style={styles.setmealHero} />
            ) : null}
            <Text style={styles.modalTitle}>セット詳細</Text>
            <Text style={styles.modalDishName}>{setmealDetail?.name}</Text>
            <Text style={styles.desc}>{setmealDetail?.description || "説明なし"}</Text>
            <View style={styles.discountBox}>
              <Text style={styles.discountLine}>セット価格: ¥{Number(setmealDetail?.price || 0).toFixed(0)}</Text>
              <Text style={styles.discountLine}>通常合計: ¥{getSetmealOriginalPrice(setmealDetail).toFixed(0)}</Text>
              <Text style={styles.discountSave}>
                お得: ¥{Math.max(0, getSetmealOriginalPrice(setmealDetail) - Number(setmealDetail?.price || 0)).toFixed(0)}
              </Text>
            </View>
            <ScrollView style={{ maxHeight: 220 }}>
              {setmealDishList.map((dish, idx) => (
                <View key={`${dish.name}-${idx}`} style={styles.setmealDishCard}>
                  {setmealDishList[idx]?.image ? (
                    <Image source={{ uri: resolveImage(setmealDishList[idx]?.image) }} style={styles.setmealDishImage} />
                  ) : (
                    <View style={styles.setmealDishImage} />
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.setmealDishName}>{dish.name}</Text>
                    <Text style={styles.setmealDishDesc} numberOfLines={2}>
                      {dish.description || "説明はありません"}
                    </Text>
                    <View style={styles.setmealDishBottom}>
                      <Text style={styles.setmealDishCopies}>x{dish.copies}</Text>
                      <Text style={styles.setmealDishPrice}>¥{Number(dish.unitPrice).toFixed(0)}</Text>
                    </View>
                  </View>
                </View>
              ))}
              {(setmealDishList.length === 0) && (
                <Text style={styles.emptyText}>このセットの内訳はまだ設定されていません</Text>
              )}
            </ScrollView>
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalBtn, styles.modalCancel]} onPress={() => setSetmealVisible(false)}>
                <Text style={styles.modalCancelText}>閉じる</Text>
              </Pressable>
              <Pressable
                style={[styles.modalBtn, styles.modalConfirm]}
                onPress={async () => {
                  if (!setmealDetail) return;
                  await onAddMenu({ ...setmealDetail, _kind: "setmeal" });
                  setSetmealVisible(false);
                }}
              >
                <Text style={styles.modalConfirmText}>カートに追加</Text>
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
  modeTabs: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 4,
    backgroundColor: "#fff",
  },
  modeTab: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#eef2ff",
  },
  modeTabActive: { backgroundColor: "#2563eb" },
  modeTabText: { color: "#1f2937", fontWeight: "600" },
  modeTabTextActive: { color: "#fff" },
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
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#111827",
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 4,
  },
  image: { width: "100%", height: 160, resizeMode: "cover" },
  imagePlaceholder: { width: "100%", height: 160, backgroundColor: "#e5e7eb" },
  cardBody: { padding: 12, gap: 8 },
  name: { fontSize: 16, fontWeight: "700", color: "#111827" },
  setmealTag: {
    fontSize: 11,
    color: "#2563eb",
    backgroundColor: "#dbeafe",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    fontWeight: "700",
  },
  desc: { fontSize: 13, color: "#6b7280" },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  price: { fontSize: 16, fontWeight: "700", color: "#dc2626" },
  setmealActions: { flexDirection: "row", gap: 8 },
  detailBtn: { backgroundColor: "#e5e7eb", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  detailBtnText: { color: "#1f2937", fontWeight: "700" },
  addBtn: { backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#fff", fontWeight: "700" },
  cartBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    backgroundColor: "#111827",
    borderRadius: 14,
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
    maxHeight: "88%",
  },
  setmealHero: {
    width: "100%",
    height: 150,
    borderRadius: 12,
    marginBottom: 10,
    backgroundColor: "#e5e7eb",
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
  discountBox: {
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    borderRadius: 10,
    padding: 10,
    marginTop: 8,
    gap: 4,
  },
  discountLine: { color: "#7c2d12", fontWeight: "600" },
  discountSave: { color: "#dc2626", fontWeight: "800" },
  setmealDishCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    padding: 8,
    marginTop: 8,
  },
  setmealDishImage: { width: 56, height: 56, borderRadius: 8, backgroundColor: "#e5e7eb" },
  setmealDishName: { color: "#111827", fontWeight: "700" },
  setmealDishDesc: { color: "#6b7280", fontSize: 12, marginTop: 2 },
  setmealDishBottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  setmealDishCopies: { color: "#2563eb", fontWeight: "700" },
  setmealDishPrice: { color: "#dc2626", fontWeight: "700" },
});
