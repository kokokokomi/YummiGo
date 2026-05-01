import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import * as Location from "expo-location";
import { createAddress, deleteAddress, getAddressList, reverseGeocode, setDefaultAddress } from "@/src/api/address";
import type { Address } from "@/src/types/api";
import { MaterialIcons } from "@expo/vector-icons";

type TownOption = { town: string; postal: string };
type PostalResult = { address1: string; address2: string; address3: string; zipcode: string };

const ZIP_RE = /^\d{7}$/;

function toZipDigits(v: string) {
  return v.replace(/[^\d]/g, "").slice(0, 7);
}

function toZipDisplay(v: string) {
  const d = toZipDigits(v);
  if (d.length <= 3) return d;
  return `${d.slice(0, 3)}-${d.slice(3)}`;
}

export default function AddressManageScreen() {
  const [list, setList] = useState<Address[]>([]);
  const [formVisible, setFormVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState<null | "pref" | "city" | "town" | "postal">(null);
  const [postalCandidates, setPostalCandidates] = useState<PostalResult[]>([]);
  const [postalError, setPostalError] = useState("");
  const [prefectures, setPrefectures] = useState<string[]>([]);
  const [cities, setCities] = useState<string[]>([]);
  const [towns, setTowns] = useState<TownOption[]>([]);
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

  const load = async () => {
    const data = await getAddressList();
    setList(data || []);
  };

  const loadPrefectures = async () => {
    const res = await fetch("https://geoapi.heartrails.com/api/json?method=getPrefectures");
    const data = await res.json();
    const arr = (data?.response?.prefecture || []) as string[];
    setPrefectures(arr);
  };

  const loadCities = async (prefecture: string) => {
    const url = `https://geoapi.heartrails.com/api/json?method=getCities&prefecture=${encodeURIComponent(prefecture)}`;
    const res = await fetch(url);
    const data = await res.json();
    setCities((data?.response?.location || []) as string[]);
  };

  const loadTowns = async (prefecture: string, city: string) => {
    const url = `https://geoapi.heartrails.com/api/json?method=getTowns&prefecture=${encodeURIComponent(prefecture)}&city=${encodeURIComponent(city)}`;
    const res = await fetch(url);
    const data = await res.json();
    const arr = ((data?.response?.location || []) as any[]).map((x) => ({
      town: x.town as string,
      postal: String(x.postal || ""),
    }));
    setTowns(arr);
  };

  useEffect(() => {
    load().catch(() => {});
    loadPrefectures().catch(() => {});
  }, []);

  useEffect(() => {
    if (!formVisible) return;
    if (form.provinceName) {
      loadCities(form.provinceName).catch(() => {});
    }
  }, [formVisible, form.provinceName]);

  const onLocate = async () => {
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
      }));
      if (geo.provinceName) await loadCities(geo.provinceName);
      if (geo.provinceName && geo.cityName) await loadTowns(geo.provinceName, geo.cityName);
    } catch (e: any) {
      Alert.alert("エラー", e?.message || "現在地の取得に失敗しました");
    }
  };

  const applyPostalResult = async (item: PostalResult) => {
    setForm((s) => ({
      ...s,
      provinceName: item.address1 || "東京都",
      cityName: item.address2 || "",
      districtName: item.address3 || "",
      postalCode: toZipDisplay(item.zipcode || ""),
    }));
    setPostalError("");
    await loadCities(item.address1 || "東京都");
    await loadTowns(item.address1 || "東京都", item.address2 || "");
  };

  const lookupPostalCode = async (zipInput = form.postalCode) => {
    const zip = toZipDigits(zipInput);
    if (!ZIP_RE.test(zip)) return;
    try {
      const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${zip}`);
      const data = await res.json();
      const rows = (data?.results || []) as PostalResult[];
      if (!rows.length) {
        setPostalError("郵便番号に対応する住所が見つかりません");
        return;
      }
      if (rows.length === 1) {
        await applyPostalResult(rows[0]);
      } else {
        setPostalCandidates(rows);
        setPickerVisible("postal");
      }
    } catch (e: any) {
      setPostalError(e?.message || "郵便番号検索に失敗しました");
    }
  };

  const onAdd = async () => {
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
      isDefault: false,
    } as any);
    setForm({
      consignee: "",
      phone: "",
      provinceName: "東京都",
      cityName: "",
      districtName: "",
      detail: "",
      label: "自宅",
      postalCode: "",
    });
    setFormVisible(false);
    await load();
  };

  const sortedList = useMemo(() => {
    const arr = [...list];
    arr.sort((a, b) => Number(Boolean(b.isDefault)) - Number(Boolean(a.isDefault)));
    return arr;
  }, [list]);

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={styles.addEntryWrap}>
        <Pressable style={styles.addCircle} onPress={() => setFormVisible(true)}>
          <MaterialIcons name="add" size={30} color="#fff" />
        </Pressable>
        <Text style={styles.addText}>新しい住所を追加</Text>
      </View>
      <FlatList
        data={sortedList}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={styles.name}>{item.consignee} / {item.phone}</Text>
            <Text style={styles.addr}>{item.fullAddress || item.detail}</Text>
            <View style={styles.row}>
              <Pressable
                style={styles.secondaryBtn}
                onPress={async () => {
                  try {
                    await setDefaultAddress(String(item.id));
                    await load();
                  } catch (e: any) {
                    Alert.alert("設定失敗", e?.message || "デフォルト住所の設定に失敗しました");
                  }
                }}
              >
                <Text style={styles.secondaryText}>{item.isDefault ? "デフォルト" : "デフォルトにする"}</Text>
              </Pressable>
              <Pressable
                style={styles.dangerBtn}
                onPress={async () => {
                  try {
                    await deleteAddress(String(item.id));
                    await load();
                  } catch (e: any) {
                    Alert.alert("削除失敗", e?.message || "住所削除に失敗しました");
                  }
                }}
              >
                <Text style={styles.dangerText}>削除</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <Modal visible={formVisible} transparent animationType="slide" onRequestClose={() => setFormVisible(false)}>
        <Pressable style={styles.mask} onPress={Keyboard.dismiss}>
          <Pressable style={styles.modal} onPress={() => {}}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8, paddingBottom: 16 }}>
            <Text style={styles.title}>住所を追加</Text>
            <TextInput
              style={styles.input}
              placeholder="受取人名（例：山田 太郎）"
              value={form.consignee}
              onChangeText={(v) => setForm((s) => ({ ...s, consignee: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="電話番号（例：09012345678）"
              value={form.phone}
              onChangeText={(v) => setForm((s) => ({ ...s, phone: v }))}
              keyboardType="phone-pad"
            />
            <View style={styles.row}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="郵便番号（7桁）"
                value={form.postalCode}
                onChangeText={(v) => {
                  const zipDisplay = toZipDisplay(v);
                  setForm((s) => ({ ...s, postalCode: zipDisplay }));
                  setPostalError("");
                  if (toZipDigits(zipDisplay).length === 7) lookupPostalCode(zipDisplay);
                }}
                keyboardType="number-pad"
              />
              <Pressable style={styles.secondaryBtn} onPress={lookupPostalCode}>
                <Text style={styles.secondaryText}>郵便番号検索</Text>
              </Pressable>
            </View>
            {postalError ? <Text style={styles.error}>{postalError}</Text> : null}

            <Pressable style={[styles.input, styles.wardPicker]} onPress={() => setPickerVisible("pref")}>
              <Text style={{ color: form.provinceName ? "#111827" : "#9ca3af" }}>
                {form.provinceName || "都道府県を選択"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.input, styles.wardPicker, !form.provinceName && styles.disabled]}
              onPress={() => form.provinceName && setPickerVisible("city")}
            >
              <Text style={{ color: form.cityName ? "#111827" : "#9ca3af" }}>
                {form.cityName || "市区町村を選択"}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.input, styles.wardPicker, !form.cityName && styles.disabled]}
              onPress={() => form.cityName && setPickerVisible("town")}
            >
              <Text style={{ color: form.districtName ? "#111827" : "#9ca3af" }}>
                {form.districtName || "町域・地区を選択"}
              </Text>
            </Pressable>
            <TextInput
              style={styles.input}
              placeholder="番地・建物名・部屋番号（手動入力）"
              value={form.detail}
              onChangeText={(v) => setForm((s) => ({ ...s, detail: v }))}
            />
            <TextInput
              style={styles.input}
              placeholder="ラベル（例：自宅 / 会社）"
              value={form.label}
              onChangeText={(v) => setForm((s) => ({ ...s, label: v }))}
            />

            {locationHint ? <Text style={styles.addr}>現在地候補: {locationHint}</Text> : null}
            <View style={styles.row}>
              <Pressable style={styles.secondaryBtn} onPress={onLocate}>
                <Text style={styles.secondaryText}>現在地から自動入力</Text>
              </Pressable>
              <Pressable style={styles.primaryBtn} onPress={onAdd}>
                <Text style={styles.primaryText}>保存</Text>
              </Pressable>
            </View>
            <Pressable style={styles.cancelBtn} onPress={() => setFormVisible(false)}>
              <Text style={styles.cancelText}>閉じる</Text>
            </Pressable>
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      <Modal visible={pickerVisible === "pref"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.wardModal}>
            <Text style={styles.title}>都道府県を選択</Text>
            <FlatList
              data={prefectures}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.wardItem}
                  onPress={async () => {
                    setForm((s) => ({ ...s, provinceName: item, cityName: "", districtName: "" }));
                    setCities([]);
                    setTowns([]);
                    await loadCities(item);
                    setPickerVisible(null);
                  }}
                >
                  <Text style={styles.secondaryText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={pickerVisible === "city"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.wardModal}>
            <Text style={styles.title}>市区町村を選択</Text>
            <FlatList
              data={cities}
              keyExtractor={(x) => x}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.wardItem}
                  onPress={async () => {
                    setForm((s) => ({ ...s, cityName: item, districtName: "" }));
                    setTowns([]);
                    await loadTowns(form.provinceName, item);
                    setPickerVisible(null);
                  }}
                >
                  <Text style={styles.secondaryText}>{item}</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={pickerVisible === "town"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.wardModal}>
            <Text style={styles.title}>町域・地区を選択</Text>
            <FlatList
              data={towns}
              keyExtractor={(x) => `${x.postal}-${x.town}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.wardItem}
                  onPress={() => {
                    setForm((s) => ({ ...s, districtName: item.town, postalCode: toZipDisplay(item.postal) }));
                    setPickerVisible(null);
                  }}
                >
                  <Text style={styles.secondaryText}>{item.town} ({toZipDisplay(item.postal)})</Text>
                </Pressable>
              )}
            />
          </View>
        </View>
      </Modal>

      <Modal visible={pickerVisible === "postal"} transparent animationType="fade" onRequestClose={() => setPickerVisible(null)}>
        <View style={styles.mask}>
          <View style={styles.wardModal}>
            <Text style={styles.title}>候補住所を選択</Text>
            <FlatList
              data={postalCandidates}
              keyExtractor={(x, idx) => `${x.zipcode}-${idx}`}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.wardItem}
                  onPress={async () => {
                    await applyPostalResult(item);
                    setPickerVisible(null);
                  }}
                >
                  <Text style={styles.secondaryText}>
                    {item.address1}{item.address2}{item.address3}
                  </Text>
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
  page: { flex: 1, backgroundColor: "#f8fafc", padding: 12, gap: 8 },
  title: { fontSize: 18, fontWeight: "700", color: "#111827" },
  addEntryWrap: { alignItems: "center", marginBottom: 10 },
  addCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  addText: { marginTop: 6, color: "#374151", fontWeight: "700" },
  item: { backgroundColor: "#fff", borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 10, padding: 10, marginBottom: 8 },
  name: { fontWeight: "700", color: "#111827" },
  addr: { color: "#4b5563", marginTop: 4 },
  mask: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
  modal: { backgroundColor: "#fff", borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 12, gap: 8, maxHeight: "84%" },
  input: { borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 8 },
  wardPicker: { justifyContent: "center" },
  disabled: { opacity: 0.55 },
  error: { color: "#dc2626", fontSize: 12, marginTop: -2 },
  row: { flexDirection: "row", gap: 8, alignItems: "center" },
  primaryBtn: { flex: 1, backgroundColor: "#2563eb", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  primaryText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: { flex: 1, backgroundColor: "#f3f4f6", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  secondaryText: { color: "#374151", fontWeight: "700" },
  cancelBtn: { backgroundColor: "#111827", borderRadius: 8, alignItems: "center", paddingVertical: 10 },
  cancelText: { color: "#fff", fontWeight: "700" },
  dangerBtn: { backgroundColor: "#ef4444", borderRadius: 8, alignItems: "center", paddingHorizontal: 12, paddingVertical: 10 },
  dangerText: { color: "#fff", fontWeight: "700" },
  wardModal: { backgroundColor: "#fff", borderRadius: 12, margin: 20, padding: 12, maxHeight: "70%" },
  wardItem: { paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
});

