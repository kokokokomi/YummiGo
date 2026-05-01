import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import * as Location from "expo-location";
import { router } from "expo-router";

import { createAddress, getAddressList, getDefaultAddress, reverseGeocode, setDefaultAddress } from "@/src/api/address";
import { createOrderPayment, submitOrder } from "@/src/api/order";
import { API_BASE_URL } from "@/src/config/env";
import { useAuth } from "@/src/state/auth";
import { useCart } from "@/src/state/cart";
import type { Address } from "@/src/types/api";

export default function OrderConfirmScreen() {
  const { profile } = useAuth();
  const { items, totalAmount, clearAll } = useCart();
  const [address, setAddress] = useState<Address | null>(null);
  const [addressList, setAddressList] = useState<Address[]>([]);
  const [addressVisible, setAddressVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [remark, setRemark] = useState("");
  const [needTableware, setNeedTableware] = useState(true);
  const [tablewareNumber, setTablewareNumber] = useState(0);

  const [newAddressVisible, setNewAddressVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<null | "pref" | "city" | "town">(null);
  const [postalError, setPostalError] = useState("");
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [towns, setTowns] = useState<{ town: string; postal: string }[]>([]);
  const [locationHint, setLocationHint] = useState("");
  const [form, setForm] = useState({
    consignee: "",
    phone: "",
    provinceName: "東京都",
    cityName: "",
    districtName: "",
    detail: "",
    label: "自宅",
    postalCode: "",
  });

  const itemCount = useMemo(() => items.reduce((s, i) => s + i.number, 0), [items]);
  const resolveImage = (img?: string) => {
    if (!img) return "";
    if (img.startsWith("http://") || img.startsWith("https://")) return img;
    return `${API_BASE_URL}${img.startsWith("/") ? "" : "/"}${img}`;
  };

  const loadAddress = async () => {
    try {
      const [list, d] = await Promise.all([getAddressList(), getDefaultAddress()]);
      setAddressList(list || []);
      setAddress(d || null);
    } catch {
      setAddressList([]);
      setAddress(null);
    }
  };

  useEffect(() => {
    loadAddress();
    fetch("https://geoapi.heartrails.com/api/json?method=getPrefectures")
      .then((r) => r.json())
      .then((d) => setPrefectures((d?.response?.prefecture || []) as string[]))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!newAddressVisible) return;
    if (form.provinceName) {
      loadCities(form.provinceName).catch(() => {});
    }
  }, [newAddressVisible, form.provinceName]);

  const onCreateAddress = async () => {
    const v = form;
    if (!v.consignee || !v.phone || !v.provinceName || !v.cityName || !v.districtName || !v.detail) {
      Alert.alert("入力不足", "必須項目を入力してください");
      return;
    }
    await createAddress({
      ...v,
      sex: "1",
      provinceCode: "",
      cityCode: "",
      districtCode: "",
      isDefault: true,
    } as any);
    setNewAddressVisible(false);
    setForm({ consignee: "", phone: "", provinceName: "東京都", cityName: "", districtName: "", detail: "", label: "自宅", postalCode: "" });
    await loadAddress();
  };

  const formatZip = (v: string) => {
    const d = v.replace(/[^\d]/g, "").slice(0, 7);
    return d.length <= 3 ? d : `${d.slice(0, 3)}-${d.slice(3)}`;
  };
  const zipDigits = (v: string) => v.replace(/[^\d]/g, "").slice(0, 7);

  const loadCities = async (pref: string) => {
    const u = `https://geoapi.heartrails.com/api/json?method=getCities&prefecture=${encodeURIComponent(pref)}`;
    const r = await fetch(u);
    const d = await r.json();
    setCities((d?.response?.location || []) as string[]);
  };

  const loadTowns = async (pref: string, city: string) => {
    const u = `https://geoapi.heartrails.com/api/json?method=getTowns&prefecture=${encodeURIComponent(pref)}&city=${encodeURIComponent(city)}`;
    const r = await fetch(u);
    const d = await r.json();
    setTowns(((d?.response?.location || []) as any[]).map((x) => ({ town: String(x.town || ""), postal: String(x.postal || "") })));
  };

  const lookupPostal = async (zipDisplay = form.postalCode) => {
    const zip = zipDigits(zipDisplay);
    if (zip.length !== 7) return;
    const r = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
    const d = await r.json();
    const row = d?.results?.[0];
    if (!row) {
      setPostalError("郵便番号に対応する住所が見つかりません");
      return;
    }
    setPostalError("");
    setForm((s) => ({
      ...s,
      postalCode: formatZip(zip),
      provinceName: row.address1 || "東京都",
      cityName: row.address2 || "",
      districtName: row.address3 || "",
    }));
    await loadCities(row.address1 || "東京都");
    await loadTowns(row.address1 || "東京都", row.address2 || "");
  };

  const fillByCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("権限不足", "位置情報の権限を許可してください");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      const geo = await reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      setLocationHint(geo.displayName || "");
      setForm((s) => ({
        ...s,
        provinceName: geo.provinceName || "東京都",
        cityName: geo.cityName || s.cityName,
        districtName: geo.districtName || s.districtName,
        // 中文注释：detail 留给用户手动输入门牌号等详细信息
        detail: s.detail,
      }));
      if (geo.provinceName) await loadCities(geo.provinceName);
      if (geo.provinceName && geo.cityName) await loadTowns(geo.provinceName, geo.cityName);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "現在地の取得に失敗しました");
    }
  };

  const onSubmit = async () => {
    if (items.length === 0) {
      Alert.alert("カート空", "商品を選んでください");
      return;
    }
    if (!address?.id) {
      Alert.alert("住所未設定", "住所を設定してください");
      return;
    }
    setSubmitting(true);
    try {
      const order = await submitOrder({
        addressBookId: String(address.id),
        payMethod: 2,
        remark: remark || undefined,
        deliveryStatus: 1,
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

      await WebBrowser.openBrowserAsync(payment.checkoutUrl);
      await clearAll();
      router.replace("/(tabs)/orders");
    } catch (e: any) {
      Alert.alert("決済エラー", e?.message || "支払いに失敗しました");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.title}>配達先</Text>
          <Pressable onPress={() => setAddressVisible(true)}>
            <Text style={styles.link}>変更</Text>
          </Pressable>
        </View>
        {address ? (
          <>
            <Text style={styles.name}>{address.consignee} / {address.phone}</Text>
            <Text style={styles.addr}>{address.fullAddress || address.detail}</Text>
          </>
        ) : (
          <Text style={styles.addr}>住所がありません</Text>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>注文内容</Text>
        <FlatList
          data={items}
          keyExtractor={(x) => String(x.id)}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 8 }}
          renderItem={({ item }) => (
            <View style={styles.menuItem}>
              <Image
                source={resolveImage(item.image) ? { uri: resolveImage(item.image) } : require("../../assets/images/icon.png")}
                style={styles.thumb}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.addr}>{item.dishFlavor || "-"}</Text>
              </View>
              <Text style={styles.addr}>x{item.number}</Text>
              <Text style={styles.price}>¥{Number(item.amount).toFixed(0)}</Text>
            </View>
          )}
        />
        <View style={styles.summaryRow}>
          <Text style={styles.addr}>商品数: {itemCount}</Text>
          <Text style={styles.total}>合計: ¥{totalAmount.toFixed(0)}</Text>
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>カトラリー</Text>
        <View style={styles.row}>
          <Text>カトラリー</Text>
          <View style={styles.row}>
            <Pressable style={[styles.chip, needTableware && styles.chipActive]} onPress={() => setNeedTableware(true)}>
              <Text style={[styles.chipText, needTableware && styles.chipTextActive]}>必要</Text>
            </Pressable>
            <Pressable style={[styles.chip, !needTableware && styles.chipActive]} onPress={() => setNeedTableware(false)}>
              <Text style={[styles.chipText, !needTableware && styles.chipTextActive]}>不要</Text>
            </Pressable>
          </View>
        </View>
        {needTableware && (
          <View style={styles.row}>
            <Text>数量</Text>
            <View style={styles.row}>
              <Pressable style={styles.counter} onPress={() => setTablewareNumber((n) => Math.max(0, n - 1))}><Text>-</Text></Pressable>
              <Text>{tablewareNumber}</Text>
              <Pressable style={styles.counter} onPress={() => setTablewareNumber((n) => n + 1)}><Text>+</Text></Pressable>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.title}>備考</Text>
        <TextInput style={styles.input} placeholder="備考（任意）" value={remark} onChangeText={setRemark} />
      </View>
        </ScrollView>

        <View style={styles.bottomBarWrap}>
          <View style={styles.bottomBar}>
            <View style={styles.totalPanel}>
              <Text style={styles.totalLabel}>合計</Text>
              <Text style={styles.totalValue}>¥{totalAmount.toFixed(0)}</Text>
            </View>
            <Pressable style={[styles.submitPanel, submitting && { opacity: 0.7 }]} disabled={submitting} onPress={onSubmit}>
              <Text style={styles.submitText}>{submitting ? "処理中..." : "提交订单"}</Text>
            </Pressable>
          </View>
        </View>

      <Modal visible={addressVisible} transparent animationType="slide" onRequestClose={() => setAddressVisible(false)}>
        <View style={styles.mask}>
          <View style={styles.modal}>
            <Text style={styles.title}>住所を選択</Text>
            <FlatList
              data={addressList}
              keyExtractor={(i) => String(i.id)}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.addrItem}
                  onPress={async () => {
                    await setDefaultAddress(String(item.id));
                    setAddress(item);
                    setAddressVisible(false);
                  }}
                >
                  <Text style={styles.name}>{item.consignee} / {item.phone}</Text>
                  <Text style={styles.addr}>{item.fullAddress || item.detail}</Text>
                </Pressable>
              )}
              ListFooterComponent={
                <Pressable style={styles.secondaryBtn} onPress={() => setNewAddressVisible(true)}>
                  <Text style={styles.secondaryText}>新しい住所を追加</Text>
                </Pressable>
              }
            />
          </View>
        </View>
      </Modal>

      <Modal visible={newAddressVisible} transparent animationType="slide" onRequestClose={() => setNewAddressVisible(false)}>
        <Pressable style={styles.mask} onPress={Keyboard.dismiss}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
            <Text style={styles.title}>住所追加</Text>
            <TextInput style={styles.input} placeholder="受取人名" value={form.consignee} onChangeText={(v) => setForm((s) => ({ ...s, consignee: v }))} />
            <TextInput style={styles.input} placeholder="電話番号" value={form.phone} onChangeText={(v) => setForm((s) => ({ ...s, phone: v }))} keyboardType="phone-pad" />
            <TextInput
              style={styles.input}
              placeholder="郵便番号（XXX-XXXX）"
              value={form.postalCode}
              onChangeText={(v) => {
                const f = formatZip(v);
                setForm((s) => ({ ...s, postalCode: f }));
                setPostalError("");
                if (zipDigits(f).length === 7) lookupPostal(f).catch(() => {});
              }}
              keyboardType="number-pad"
            />
            {postalError ? <Text style={{ color: "#dc2626", fontSize: 12 }}>{postalError}</Text> : null}
            <Pressable style={[styles.input, { justifyContent: "center" }]} onPress={() => setPickerVisible("pref")}>
              <Text>{form.provinceName || "都道府県を選択"}</Text>
            </Pressable>
            <Pressable
              style={[styles.input, { justifyContent: "center", opacity: form.provinceName ? 1 : 0.55 }]}
              onPress={() => form.provinceName && setPickerVisible("city")}
            >
              <Text>{form.cityName || "市区町村を選択"}</Text>
            </Pressable>
            <Pressable
              style={[styles.input, { justifyContent: "center", opacity: form.cityName ? 1 : 0.55 }]}
              onPress={() => form.cityName && setPickerVisible("town")}
            >
              <Text>{form.districtName || "町域・地区を選択"}</Text>
            </Pressable>
            <TextInput style={styles.input} placeholder="番地・建物名・部屋番号" value={form.detail} onChangeText={(v) => setForm((s) => ({ ...s, detail: v }))} />
            <TextInput style={styles.input} placeholder="ラベル" value={form.label} onChangeText={(v) => setForm((s) => ({ ...s, label: v }))} />
            {locationHint ? <Text style={styles.addr}>現在地候補: {locationHint}</Text> : null}
            <Pressable style={styles.secondaryBtn} onPress={fillByCurrentLocation}>
              <Text style={styles.secondaryText}>現在地から入力</Text>
            </Pressable>
            <View style={styles.row}>
              <Pressable style={styles.secondaryBtn} onPress={() => setNewAddressVisible(false)}>
                <Text style={styles.secondaryText}>キャンセル</Text>
              </Pressable>
              <Pressable style={styles.payBtn} onPress={onCreateAddress}>
                <Text style={styles.payText}>保存</Text>
              </Pressable>
            </View>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
      <Modal visible={pickerVisible === "pref"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.modal}>
            <Text style={styles.title}>都道府県を選択</Text>
            <FlatList
              data={prefectures}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.addrItem}
                  onPress={async () => {
                    setForm((s) => ({ ...s, provinceName: item, cityName: "", districtName: "" }));
                    setCities([]);
                    setTowns([]);
                    await loadCities(item);
                    setPickerVisible(null);
                  }}
                >
                  <Text>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={pickerVisible === "city"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.modal}>
            <Text style={styles.title}>市区町村を選択</Text>
            <FlatList
              data={cities}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.addrItem}
                  onPress={async () => {
                    setForm((s) => ({ ...s, cityName: item, districtName: "" }));
                    setTowns([]);
                    await loadTowns(form.provinceName, item);
                    setPickerVisible(null);
                  }}
                >
                  <Text>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      <Modal visible={pickerVisible === "town"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.modal}>
            <Text style={styles.title}>町域・地区を選択</Text>
            <FlatList
              data={towns}
              keyExtractor={(x) => `${x.postal}-${x.town}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.addrItem}
                  onPress={() => {
                    setForm((s) => ({ ...s, districtName: item.town, postalCode: formatZip(item.postal) }));
                    setPickerVisible(null);
                  }}
                >
                  <Text>{item.town} ({formatZip(item.postal)})</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  scrollContent: { padding: 12, gap: 10, paddingBottom: 120 },
  card: { backgroundColor: "#fff", borderRadius: 12, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", gap: 8 },
  title: { fontWeight: "700", color: "#111827" },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  link: { color: "#2563eb", fontWeight: "700" },
  name: { fontWeight: "700", color: "#111827" },
  price: { color: "#dc2626", fontWeight: "700" },
  total: { color: "#111827", fontWeight: "700", fontSize: 16 },
  addr: { color: "#4b5563" },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  thumb: { width: 42, height: 42, borderRadius: 8, backgroundColor: "#e5e7eb" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 4 },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8 },
  chip: { backgroundColor: "#eef2ff", borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6 },
  chipActive: { backgroundColor: "#2563eb" },
  chipText: { color: "#1f2937" },
  chipTextActive: { color: "#fff" },
  counter: { backgroundColor: "#e5e7eb", width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 14, maxHeight: "75%", gap: 8 },
  addrItem: { padding: 10, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, marginBottom: 8 },
  secondaryBtn: { backgroundColor: "#f3f4f6", borderRadius: 10, alignItems: "center", paddingVertical: 12, flex: 1 },
  secondaryText: { color: "#374151", fontWeight: "700" },
  payBtn: { backgroundColor: "#2563eb", borderRadius: 10, alignItems: "center", paddingVertical: 12, flex: 1 },
  payText: { color: "#fff", fontWeight: "700" },
  bottomBarWrap: { position: "absolute", left: 12, right: 12, bottom: 12 },
  bottomBar: { borderRadius: 16, overflow: "hidden", flexDirection: "row", borderWidth: 1, borderColor: "#1e3a8a" },
  totalPanel: { flex: 1, backgroundColor: "#1f2937", paddingVertical: 12, paddingHorizontal: 14, justifyContent: "center" },
  totalLabel: { color: "#cbd5e1", fontSize: 12, fontWeight: "600" },
  totalValue: { color: "#fff", fontWeight: "800", fontSize: 18, marginTop: 2 },
  submitPanel: { width: 150, backgroundColor: "#2563eb", alignItems: "center", justifyContent: "center" },
  submitText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

