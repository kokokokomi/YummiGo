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

const SIDEBAR_WIDTH = 88;
const MENU_IMAGE_SIZE = 96;
const MAIN_KINDS: { key: MenuKind; label: string }[] = [
  { key: "dish", label: "料理" },
  { key: "setmeal", label: "セット" },
];

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
    setSelectedCategoryId("");
    return "";
  };

  const loadMenus = async (kind: MenuKind, categoryId: string) => {
    if (!categoryId) {
      setMenuList([]);
      return;
    }
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
      const categoryId = selectedCategoryId || (await loadCategories(menuKind));
      await loadMenus(menuKind, categoryId);
    } finally {
      setRefreshing(false);
    }
  };

  const onSwitchMenuKind = async (kind: MenuKind) => {
    if (menuKind === kind) return;
    setMenuKind(kind);
    setLoading(true);
    try {
      const categoryId = await loadCategories(kind);
      await loadMenus(kind, categoryId);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "データ取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  const onSelectCategory = async (categoryId: string) => {
    if (categoryId === selectedCategoryId) return;
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

  const parseFlavorOptions = (flavor: DishFlavor) => {
    const raw = flavor?.value ?? "";
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch {
      // ignore
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
    const dishFlavor = flavors.map((f) => `${f.name}:${selectedFlavor[f.name]}`).join(",");
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
      const detailedFromConfig = setmealConfigDishes
        .map((configDish, idx) => {
          const dishIdKey = String(configDish.dishId || "").trim();
          const nameKey = normalizeName(configDish.name);
          const key = nameKey || dishIdKey || String(idx);
          if (seenKeys.has(key)) return null;
          seenKeys.add(key);
          const matchedDetail = detailByDishId.get(dishIdKey) || detailByName.get(nameKey);
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
      if (setmealFull) setSetmealDetail(setmealFull);
    } catch (e: any) {
      setSetmealDishList([]);
      Alert.alert("お知らせ", e?.message || "セット内訳の取得に失敗しました。基本情報のみ表示しています。");
    }
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={styles.menuRow}>
      {item.image ? (
        <Image source={{ uri: resolveImage(item.image) }} style={styles.menuImage} />
      ) : (
        <View style={styles.menuImagePlaceholder}>
          <MaterialIcons name="restaurant" size={28} color="#cbd5e1" />
        </View>
      )}
      <View style={styles.menuInfo}>
        <View style={styles.menuTitleRow}>
          <Text style={styles.menuName} numberOfLines={2}>
            {item.name}
          </Text>
          {item._kind === "setmeal" && <Text style={styles.setmealBadge}>セット</Text>}
        </View>
        <Text style={styles.menuDesc} numberOfLines={2}>
          {item.description || "—"}
        </Text>
        <View style={styles.menuFooter}>
          <Text style={styles.menuPrice}>¥{Number(item.price).toFixed(0)}</Text>
          <View style={styles.menuActions}>
            {item._kind === "setmeal" && (
              <Pressable style={styles.detailLink} onPress={() => onOpenSetmealDetail(item as Setmeal)}>
                <Text style={styles.detailLinkText}>詳細</Text>
              </Pressable>
            )}
            <Pressable style={styles.addCircle} onPress={() => onAddMenu(item)}>
              <MaterialIcons name="add" size={22} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );

  const listHeader = (
    <View style={styles.contentHeader}>
      <Text style={styles.contentTitle}>{selectedCategoryName || (menuKind === "dish" ? "料理" : "セット")}</Text>
      <Text style={styles.contentSub}>{menuList.length} 品</Text>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.mainRow}>
        {/* 左侧：料理 / セット + 分类 */}
        <View style={styles.sidebar}>
          {MAIN_KINDS.map((kind) => {
            const active = menuKind === kind.key;
            return (
              <Pressable
                key={kind.key}
                style={[styles.kindItem, active && styles.kindItemActive]}
                onPress={() => onSwitchMenuKind(kind.key)}
              >
                {active && <View style={styles.kindActiveBar} />}
                <Text style={[styles.kindText, active && styles.kindTextActive]} numberOfLines={2}>
                  {kind.label}
                </Text>
              </Pressable>
            );
          })}
          <View style={styles.sidebarDivider} />
          <ScrollView
            style={styles.categoryScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.categoryScrollContent}
          >
            {categories.map((cat) => {
              const active = String(cat.id) === selectedCategoryId;
              return (
                <Pressable
                  key={String(cat.id)}
                  style={[styles.categoryItem, active && styles.categoryItemActive]}
                  onPress={() => onSelectCategory(String(cat.id))}
                >
                  {active && <View style={styles.categoryActiveBar} />}
                  <Text style={[styles.categoryText, active && styles.categoryTextActive]} numberOfLines={3}>
                    {cat.name}
                  </Text>
                </Pressable>
              );
            })}
            {categories.length === 0 && (
              <Text style={styles.sidebarEmpty}>分類なし</Text>
            )}
          </ScrollView>
        </View>

        {/* 右侧：菜品列表 */}
        <View style={styles.content}>
          <FlatList
            data={menuList}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMenuItem}
            ListHeaderComponent={listHeader}
            stickyHeaderIndices={[0]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
            contentContainerStyle={styles.menuListContent}
            ItemSeparatorComponent={() => <View style={styles.menuSeparator} />}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <MaterialIcons name="inbox" size={40} color="#cbd5e1" />
                <Text style={styles.emptyText}>この分類には商品がありません</Text>
              </View>
            }
          />
        </View>
      </View>

      <View style={styles.cartBar}>
        <Pressable style={styles.cartLeft} onPress={() => setCartVisible(true)}>
          <View style={styles.cartIconWrap}>
            <MaterialIcons name="shopping-cart" size={24} color="#fff" />
            {totalCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{totalCount > 99 ? "99+" : totalCount}</Text>
              </View>
            )}
          </View>
          <View>
            <Text style={styles.cartLabel}>カート</Text>
            <Text style={styles.cartAmount}>¥{totalAmount.toFixed(0)}</Text>
          </View>
        </Pressable>
        <Pressable
          style={[styles.checkoutBtn, totalCount === 0 && styles.checkoutBtnDisabled]}
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
                  {item.image ? (
                    <Image source={{ uri: resolveImage(item.image) }} style={styles.cartItemImage} />
                  ) : (
                    <View style={styles.cartItemImage} />
                  )}
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
                            onPress={() => setSelectedFlavor((prev) => ({ ...prev, [flavor.name]: opt }))}
                          >
                            <Text style={[styles.flavorChipText, active && styles.flavorChipTextActive]}>{opt}</Text>
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
              {setmealDishList.length === 0 && (
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
  page: { flex: 1, backgroundColor: "#fff" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },
  mainRow: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#f3f4f6",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e5e7eb",
  },
  kindItem: {
    minHeight: 52,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    paddingVertical: 10,
    position: "relative",
  },
  kindItemActive: {
    backgroundColor: "#fff",
  },
  kindActiveBar: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  kindText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 18,
  },
  kindTextActive: {
    color: "#111827",
    fontWeight: "800",
  },
  sidebarDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  categoryScroll: { flex: 1 },
  categoryScrollContent: { paddingBottom: 88 },
  categoryItem: {
    minHeight: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 10,
    position: "relative",
  },
  categoryItemActive: {
    backgroundColor: "#fff",
  },
  categoryActiveBar: {
    position: "absolute",
    left: 0,
    top: 8,
    bottom: 8,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  categoryText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
  },
  categoryTextActive: {
    color: "#111827",
    fontWeight: "700",
  },
  sidebarEmpty: {
    fontSize: 11,
    color: "#9ca3af",
    textAlign: "center",
    padding: 12,
  },
  content: {
    flex: 1,
    backgroundColor: "#fff",
  },
  contentHeader: {
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  contentTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#111827",
  },
  contentSub: {
    marginTop: 2,
    fontSize: 12,
    color: "#9ca3af",
  },
  menuListContent: {
    paddingBottom: 96,
    flexGrow: 1,
  },
  menuRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
    alignItems: "flex-start",
  },
  menuImage: {
    width: MENU_IMAGE_SIZE,
    height: MENU_IMAGE_SIZE,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
  },
  menuImagePlaceholder: {
    width: MENU_IMAGE_SIZE,
    height: MENU_IMAGE_SIZE,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  menuInfo: {
    flex: 1,
    minHeight: MENU_IMAGE_SIZE,
    justifyContent: "space-between",
  },
  menuTitleRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    flexWrap: "wrap",
  },
  menuName: {
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
    color: "#111827",
    lineHeight: 20,
  },
  setmealBadge: {
    fontSize: 10,
    color: "#b45309",
    backgroundColor: "#fef3c7",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    fontWeight: "700",
    overflow: "hidden",
  },
  menuDesc: {
    marginTop: 4,
    fontSize: 12,
    color: "#9ca3af",
    lineHeight: 17,
  },
  menuFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  menuPrice: {
    fontSize: 16,
    fontWeight: "800",
    color: "#dc2626",
  },
  menuActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  detailLink: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  detailLinkText: {
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "600",
  },
  addCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#f59e0b",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#f59e0b",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  menuSeparator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#f1f5f9",
    marginLeft: 12 + MENU_IMAGE_SIZE + 10,
  },
  emptyBox: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 48,
    gap: 8,
  },
  emptyText: { textAlign: "center", color: "#9ca3af", fontSize: 13 },
  cartBar: {
    position: "absolute",
    left: 10,
    right: 10,
    bottom: 8,
    backgroundColor: "#1f2937",
    borderRadius: 28,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  cartLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  cartIconWrap: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
    position: "absolute",
    top: -2,
    right: -8,
    paddingHorizontal: 4,
  },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
  cartLabel: { color: "#9ca3af", fontSize: 11 },
  cartAmount: { color: "#fff", fontSize: 17, fontWeight: "800" },
  checkoutBtn: {
    backgroundColor: "#f59e0b",
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  checkoutBtnDisabled: { opacity: 0.45 },
  checkoutBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
  cartModalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  modalPayBtn: { backgroundColor: "#f59e0b", borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
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
  desc: { fontSize: 13, color: "#6b7280", marginTop: 4 },
  flavorLabel: { fontWeight: "700", color: "#374151", marginBottom: 8 },
  flavorOptions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  flavorChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
  },
  flavorChipActive: { backgroundColor: "#f59e0b" },
  flavorChipText: { color: "#1f2937" },
  flavorChipTextActive: { color: "#fff" },
  modalActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtn: { flex: 1, alignItems: "center", paddingVertical: 11, borderRadius: 10 },
  modalCancel: { backgroundColor: "#f3f4f6" },
  modalConfirm: { backgroundColor: "#f59e0b" },
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
  setmealDishCopies: { color: "#b45309", fontWeight: "700" },
  setmealDishPrice: { color: "#dc2626", fontWeight: "700" },
});
