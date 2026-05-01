import { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";

import { cleanCart, getCartList, subFromCart } from "@/src/api/cart";
import { createAddress, getAddressList, getDefaultAddress, setDefaultAddress } from "@/src/api/address";
import { createOrderPayment, submitOrder } from "@/src/api/order";
import { useAuth } from "@/src/state/auth";
import type { Address, ShoppingCartItem } from "@/src/types/api";

function computeTotal(list: ShoppingCartItem[]) {
  return list.reduce((sum, item) => sum + Number(item.amount) * Number(item.number), 0);
}

export default function CartScreen() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [items, setItems] = useState<ShoppingCartItem[]>([]);
  const [address, setAddress] = useState<Address | null>(null);
  const [addressVisible, setAddressVisible] = useState(false);
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [addressFormVisible, setAddressFormVisible] = useState(false);
  const [newConsignee, setNewConsignee] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newProvince, setNewProvince] = useState("");
  const [newCity, setNewCity] = useState("");
  const [newDistrict, setNewDistrict] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [newLabel, setNewLabel] = useState("自宅");
  const [remark, setRemark] = useState("");
  const [needTableware, setNeedTableware] = useState(true);
  const [tablewareNumber, setTablewareNumber] = useState(0);
  const [deliveryNow, setDeliveryNow] = useState(true);
  const [estimatedTime, setEstimatedTime] = useState("");

  const totalAmount = useMemo(() => computeTotal(items), [items]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cart, defaultAddress] = await Promise.all([getCartList(), getDefaultAddress()]);
      setItems(cart);
      setAddress(defaultAddress);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "カート取得に失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onMinus = async (item: ShoppingCartItem) => {
    try {
      await subFromCart({
        dishId: item.dishId ? String(item.dishId) : undefined,
        setmealId: item.setmealId ? String(item.setmealId) : undefined,
        dishFlavor: item.dishFlavor,
      });
      await loadData();
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "数量更新に失敗しました");
    }
  };

  const onClean = async () => {
    try {
      await cleanCart();
      await loadData();
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "カート削除に失敗しました");
    }
  };

  const onCheckout = async () => {
    if (!address?.id) {
      Alert.alert("住所未設定", "デフォルト住所を先に設定してください");
      return;
    }
    if (items.length === 0) {
      Alert.alert("カート空", "商品を追加してください");
      return;
    }

    setSubmitting(true);
    try {
      // 中文注释：先提交订单，再创建 Stripe Checkout 会话
      const order = await submitOrder({
        addressBookId: String(address.id),
        payMethod: 2,
        remark: remark || undefined,
        deliveryStatus: deliveryNow ? 1 : 0,
        estimatedDeliveryTime: !deliveryNow && estimatedTime ? estimatedTime : undefined,
        tablewareNumber: needTableware ? tablewareNumber : -1,
        tablewareStatus: needTableware ? 0 : 1,
        packAmount: 0,
        amount: Number(totalAmount.toFixed(2)),
      });

      const successUrl = Linking.createURL(`/payment/success?orderId=${order.id}`);
      const cancelUrl = Linking.createURL(`/payment/cancel?orderId=${order.id}`);

      const payment = await createOrderPayment({
        payMethod: 2,
        orderId: String(order.id),
        orderNumber: order.orderNumber,
        currency: "jpy",
        amountInCents: Math.round(totalAmount * 100),
        successUrl,
        cancelUrl,
        customerEmail: profile?.email,
      });

      if (!payment.checkoutUrl) {
        throw new Error("Checkout URL が空です");
      }

      await WebBrowser.openBrowserAsync(payment.checkoutUrl);
      Alert.alert("お知らせ", "支払い完了後、アプリへ戻って注文タブで結果を確認してください。");
      router.replace("/(tabs)/orders");
    } catch (e: any) {
      Alert.alert("決済エラー", e?.message || "支払い処理に失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  const openAddressPicker = async () => {
    try {
      const list = await getAddressList();
      setAddressList(list || []);
      setAddressVisible(true);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "住所一覧の取得に失敗しました");
    }
  };

  const onSelectAddress = async (item: Address) => {
    try {
      await setDefaultAddress(String(item.id));
      setAddress(item);
      setAddressVisible(false);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "住所切替に失敗しました");
    }
  };

  const onCreateAddress = async () => {
    if (!newConsignee || !newPhone || !newProvince || !newCity || !newDistrict || !newDetail) {
      Alert.alert("入力不足", "必須項目をすべて入力してください");
      return;
    }
    try {
      await createAddress({
        consignee: newConsignee,
        phone: newPhone,
        sex: "1",
        provinceCode: "",
        provinceName: newProvince,
        cityCode: "",
        cityName: newCity,
        districtCode: "",
        districtName: newDistrict,
        detail: newDetail,
        label: newLabel || "自宅",
        isDefault: true,
      } as any);
      setAddressFormVisible(false);
      setNewConsignee("");
      setNewPhone("");
      setNewProvince("");
      setNewCity("");
      setNewDistrict("");
      setNewDetail("");
      const list = await getAddressList();
      setAddressList(list || []);
      const first = (list || [])[0];
      if (first?.id) {
        await setDefaultAddress(String(first.id));
      }
      await loadData();
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "住所追加に失敗しました");
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
      <View style={styles.addressCard}>
        <Text style={styles.addressTitle}>配達先</Text>
        {address ? (
          <>
            <Text style={styles.addressName}>{address.consignee} / {address.phone}</Text>
            <Text style={styles.addressDetail}>{address.fullAddress || address.detail}</Text>
          </>
        ) : (
          <Text style={styles.addressDetail}>デフォルト住所がありません</Text>
        )}
        <Pressable style={styles.addressSwitchBtn} onPress={openAddressPicker}>
          <Text style={styles.addressSwitchText}>住所を変更</Text>
        </Pressable>
      </View>

      <View style={styles.checkoutCard}>
        <Text style={styles.checkoutTitle}>注文情報</Text>
        <TextInput
          style={styles.input}
          placeholder="備考を入力（任意）"
          value={remark}
          onChangeText={setRemark}
        />
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>カトラリー</Text>
          <View style={styles.optionActions}>
            <Pressable style={[styles.optionChip, needTableware && styles.optionChipActive]} onPress={() => setNeedTableware(true)}>
              <Text style={[styles.optionChipText, needTableware && styles.optionChipTextActive]}>必要</Text>
            </Pressable>
            <Pressable style={[styles.optionChip, !needTableware && styles.optionChipActive]} onPress={() => setNeedTableware(false)}>
              <Text style={[styles.optionChipText, !needTableware && styles.optionChipTextActive]}>不要</Text>
            </Pressable>
          </View>
        </View>
        {needTableware && (
          <View style={styles.optionRow}>
            <Text style={styles.optionLabel}>数量</Text>
            <View style={styles.counter}>
              <Pressable style={styles.counterBtn} onPress={() => setTablewareNumber((n) => Math.max(0, n - 1))}>
                <Text>-</Text>
              </Pressable>
              <Text style={styles.counterValue}>{tablewareNumber}</Text>
              <Pressable style={styles.counterBtn} onPress={() => setTablewareNumber((n) => n + 1)}>
                <Text>+</Text>
              </Pressable>
            </View>
          </View>
        )}
        <View style={styles.optionRow}>
          <Text style={styles.optionLabel}>配達時間</Text>
          <View style={styles.optionActions}>
            <Pressable style={[styles.optionChip, deliveryNow && styles.optionChipActive]} onPress={() => setDeliveryNow(true)}>
              <Text style={[styles.optionChipText, deliveryNow && styles.optionChipTextActive]}>すぐに配達</Text>
            </Pressable>
            <Pressable style={[styles.optionChip, !deliveryNow && styles.optionChipActive]} onPress={() => setDeliveryNow(false)}>
              <Text style={[styles.optionChipText, !deliveryNow && styles.optionChipTextActive]}>時間指定</Text>
            </Pressable>
          </View>
        </View>
        {!deliveryNow && (
          <TextInput
            style={styles.input}
            placeholder="yyyy-MM-dd HH:mm:ss"
            value={estimatedTime}
            onChangeText={setEstimatedTime}
          />
        )}
      </View>

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={styles.itemCard}>
            {item.image ? <Image source={{ uri: item.image }} style={styles.itemImage} /> : <View style={styles.itemImagePlaceholder} />}
            <View style={{ flex: 1 }}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>¥{Number(item.amount).toFixed(0)} x {item.number}</Text>
            </View>
            <Pressable style={styles.minusBtn} onPress={() => onMinus(item)}>
              <Text style={styles.minusText}>-1</Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.empty}>カートは空です</Text>}
      />

      <View style={styles.bottom}>
        <Text style={styles.total}>合計: ¥{totalAmount.toFixed(0)}</Text>
        <View style={styles.bottomBtns}>
          <Pressable style={[styles.btn, styles.cleanBtn]} onPress={onClean}>
            <Text style={styles.cleanBtnText}>クリア</Text>
          </Pressable>
          <Pressable style={[styles.btn, styles.payBtn, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={onCheckout}>
            <Text style={styles.payBtnText}>{submitting ? "処理中..." : "支払う"}</Text>
          </Pressable>
        </View>
      </View>

      <Modal visible={addressVisible} transparent animationType="slide" onRequestClose={() => setAddressVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>住所を選択</Text>
            <FlatList
              data={addressList}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <Pressable style={styles.addressItem} onPress={() => onSelectAddress(item)}>
                  <Text style={styles.addressItemName}>{item.consignee} / {item.phone}</Text>
                  <Text style={styles.addressItemDetail}>{item.fullAddress || item.detail}</Text>
                </Pressable>
              )}
              ListEmptyComponent={<Text style={styles.empty}>住所がありません</Text>}
            />
            <Pressable style={styles.closeBtn} onPress={() => setAddressVisible(false)}>
              <Text style={styles.closeBtnText}>閉じる</Text>
            </Pressable>
            <Pressable style={styles.addAddressBtn} onPress={() => setAddressFormVisible(true)}>
              <Text style={styles.addAddressBtnText}>新しい住所を追加</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <Modal visible={addressFormVisible} transparent animationType="slide" onRequestClose={() => setAddressFormVisible(false)}>
        <View style={styles.modalMask}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>住所を追加</Text>
            <TextInput style={styles.input} placeholder="受取人名" value={newConsignee} onChangeText={setNewConsignee} />
            <TextInput style={styles.input} placeholder="電話番号" value={newPhone} onChangeText={setNewPhone} />
            <TextInput style={styles.input} placeholder="都道府県" value={newProvince} onChangeText={setNewProvince} />
            <TextInput style={styles.input} placeholder="市区町村" value={newCity} onChangeText={setNewCity} />
            <TextInput style={styles.input} placeholder="町名・番地" value={newDistrict} onChangeText={setNewDistrict} />
            <TextInput style={styles.input} placeholder="建物名・部屋番号" value={newDetail} onChangeText={setNewDetail} />
            <TextInput style={styles.input} placeholder="ラベル（自宅など）" value={newLabel} onChangeText={setNewLabel} />
            <View style={styles.modalActions}>
              <Pressable style={[styles.modalActionBtn, styles.cleanBtn]} onPress={() => setAddressFormVisible(false)}>
                <Text style={styles.cleanBtnText}>キャンセル</Text>
              </Pressable>
              <Pressable style={[styles.modalActionBtn, styles.payBtn]} onPress={onCreateAddress}>
                <Text style={styles.payBtnText}>保存</Text>
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
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  addressCard: { backgroundColor: "#fff", margin: 12, padding: 12, borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb" },
  addressTitle: { fontSize: 14, color: "#6b7280", marginBottom: 4 },
  addressName: { fontSize: 16, fontWeight: "700", color: "#111827" },
  addressDetail: { fontSize: 13, color: "#374151", marginTop: 4 },
  addressSwitchBtn: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  addressSwitchText: { color: "#fff", fontWeight: "700", fontSize: 12 },
  checkoutCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginBottom: 8,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    gap: 10,
  },
  checkoutTitle: { fontSize: 16, fontWeight: "700", color: "#111827" },
  input: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 9,
    backgroundColor: "#fff",
  },
  optionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", gap: 10 },
  optionLabel: { color: "#374151", fontWeight: "700" },
  optionActions: { flexDirection: "row", gap: 8 },
  optionChip: { backgroundColor: "#eef2ff", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  optionChipActive: { backgroundColor: "#2563eb" },
  optionChipText: { color: "#111827", fontSize: 12 },
  optionChipTextActive: { color: "#fff" },
  counter: { flexDirection: "row", alignItems: "center", gap: 8 },
  counterBtn: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e5e7eb",
  },
  counterValue: { minWidth: 20, textAlign: "center", fontWeight: "700" },
  list: { paddingHorizontal: 12, paddingBottom: 140, gap: 10 },
  itemCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 10,
  },
  itemImage: { width: 54, height: 54, borderRadius: 10, resizeMode: "cover" },
  itemImagePlaceholder: { width: 54, height: 54, borderRadius: 10, backgroundColor: "#e5e7eb" },
  itemName: { fontSize: 15, fontWeight: "700", color: "#111827" },
  itemPrice: { marginTop: 4, color: "#6b7280" },
  minusBtn: { backgroundColor: "#ef4444", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  minusText: { color: "#fff", fontWeight: "700" },
  empty: { textAlign: "center", marginTop: 30, color: "#9ca3af" },
  bottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    padding: 12,
    gap: 10,
  },
  total: { fontSize: 18, fontWeight: "700", color: "#111827" },
  bottomBtns: { flexDirection: "row", gap: 10 },
  btn: { flex: 1, borderRadius: 10, alignItems: "center", paddingVertical: 12 },
  cleanBtn: { backgroundColor: "#f3f4f6" },
  cleanBtnText: { color: "#374151", fontWeight: "700" },
  payBtn: { backgroundColor: "#2563eb" },
  payBtnText: { color: "#fff", fontWeight: "700" },
  modalMask: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: "75%",
    padding: 14,
    paddingBottom: 22,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 10 },
  addressItem: {
    padding: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    marginBottom: 8,
    backgroundColor: "#fff",
  },
  addressItemName: { fontWeight: "700", color: "#111827" },
  addressItemDetail: { marginTop: 4, color: "#4b5563" },
  closeBtn: {
    marginTop: 8,
    backgroundColor: "#111827",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  closeBtnText: { color: "#fff", fontWeight: "700" },
  addAddressBtn: {
    marginTop: 8,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    alignItems: "center",
    paddingVertical: 10,
  },
  addAddressBtnText: { color: "#fff", fontWeight: "700" },
  modalActions: { flexDirection: "row", gap: 8, marginTop: 10 },
  modalActionBtn: { flex: 1, borderRadius: 10, alignItems: "center", paddingVertical: 10 },
});

