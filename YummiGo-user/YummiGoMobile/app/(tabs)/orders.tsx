import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  getMerchantRejectReason,
  shouldNotifyMerchantReject,
  showMerchantRejectAlert,
} from "@/src/lib/orderRejection";
import { router } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { getOrderPage } from "@/src/api/order";
import type { OrderVO } from "@/src/types/api";

const TABS = [
  { label: "すべて", value: 0 },
  { label: "支払い待ち", value: 1 },
  { label: "受付待ち", value: 2 },
  { label: "配達待ち", value: 3 },
  { label: "配達中", value: 4 },
  { label: "完了", value: 5 },
  { label: "キャンセル", value: 6 },
];

function statusText(status: number) {
  switch (status) {
    case 1:
      return "支払い待ち";
    case 2:
      return "受付待ち";
    case 3:
      return "配達待ち";
    case 4:
      return "配達中";
    case 5:
      return "完了";
    case 6:
      return "キャンセル";
    default:
      return "不明";
  }
}

export default function OrdersScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(0);
  const [list, setList] = useState<OrderVO[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [nowMs, setNowMs] = useState(Date.now());
  const allListRef = useRef<OrderVO[]>([]);
  const statusByIdRef = useRef<Map<string, number>>(new Map());

  const parseOrderTimeMs = (raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const unix = Number(text);
    if (Number.isFinite(unix) && unix > 0) {
      return unix > 1e12 ? unix : unix * 1000;
    }
    const normalized = text.replace(" ", "T");
    const direct = new Date(normalized).getTime();
    if (!Number.isNaN(direct)) return direct;
    return NaN;
  };

  const resolveOrderStartMs = (raw?: string) => {
    if (!raw) return NaN;
    const text = String(raw).trim();
    if (!text) return NaN;
    const normalized = text.replace(" ", "T");
    const now = Date.now();
    const windowMs = 15 * 60 * 1000;
    const candidates = [new Date(normalized).getTime(), new Date(`${normalized}Z`).getTime()].filter((v) => !Number.isNaN(v));
    if (candidates.length === 0) return parseOrderTimeMs(raw);
    // 中文注释：优先命中 15 分钟支付窗口，避免服务端时间字符串缺少时区导致倒计时恒为 0
    const inWindow = candidates.filter((ts) => now >= ts && now - ts <= windowMs);
    if (inWindow.length > 0) return Math.max(...inWindow);
    const notFuture = candidates.filter((ts) => ts <= now + 60 * 1000);
    if (notFuture.length > 0) return Math.max(...notFuture);
    return Math.min(...candidates);
  };

  const getRemainingText = (item: OrderVO) => {
    if (item.status !== 1 || item.payStatus === 1) return "";
    const createdMs = resolveOrderStartMs(item.orderTime);
    if (Number.isNaN(createdMs)) return "残り時間: --:--";
    const left = Math.max(0, Math.floor((createdMs + 15 * 60 * 1000 - nowMs) / 1000));
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `残り時間: ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const notifyRejectedOrders = useCallback((records: OrderVO[]) => {
    for (const item of records) {
      const key = String(item.id);
      const prevStatus = statusByIdRef.current.get(key);
      if (shouldNotifyMerchantReject(prevStatus, item)) {
        showMerchantRejectAlert(getMerchantRejectReason(item));
      }
      statusByIdRef.current.set(key, item.status);
    }
  }, []);

  const fetchList = useCallback(async (nextStatus = 0, silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      if (nextStatus === 0) {
        const page = await getOrderPage(1, 100);
        const records = page.records || [];
        notifyRejectedOrders(records);
        allListRef.current = records;
        setList(records);
      } else {
        // 优先后端筛选，若失败则回退到本地筛选，确保菜单点击一定有效
        try {
          const page = await getOrderPage(1, 100, nextStatus);
          const records = page.records || [];
          notifyRejectedOrders(records);
          setList(records);
        } catch {
          const source = allListRef.current.length > 0 ? allListRef.current : (await getOrderPage(1, 100)).records || [];
          if (allListRef.current.length === 0) allListRef.current = source;
          const filtered = source.filter((x) => x.status === nextStatus);
          notifyRejectedOrders(filtered);
          setList(filtered);
        }
      }
    } catch (e: any) {
      setError(e?.message || "注文取得に失敗しました");
      setList([]);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [notifyRejectedOrders]);

  useEffect(() => {
    // 中文注释：仅在页面首次进入时请求一次，避免依赖变化导致重复请求
    fetchList(0);
  }, [fetchList]);

  useFocusEffect(
    useCallback(() => {
      // 进入订单页时立即刷新一次，并在前台定期刷新状态
      fetchList(status, true);
      const secondTimer = setInterval(() => {
        setNowMs(Date.now());
      }, 1000);
      const timer = setInterval(() => {
        fetchList(status, true);
      }, 15000);
      return () => {
        clearInterval(timer);
        clearInterval(secondTimer);
      };
    }, [fetchList, status])
  );

  const onChangeStatus = async (next: number) => {
    setStatus(next);
    await fetchList(next);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList(status, true);
    setRefreshing(false);
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
      <View style={styles.tabRow}>
        <FlatList
          horizontal
          data={TABS}
          keyExtractor={(item) => String(item.value)}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => {
            const active = item.value === status;
            return (
              <Pressable style={[styles.tab, active && styles.tabActive]} onPress={() => onChangeStatus(item.value)}>
                <Text style={[styles.tabText, active && styles.tabTextActive]}>{item.label}</Text>
              </Pressable>
            );
          }}
        />
      </View>

      <FlatList
        data={list}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <Pressable
            style={styles.card}
            onPress={() => {
              if (item.status === 1 && item.payStatus !== 1) {
                router.push(`/order/detail?id=${item.id}`);
                return;
              }
              router.push(`/order/detail?id=${item.id}`);
            }}
          >
            <View style={styles.row}>
              <Text style={styles.orderNo}>注文番号: {item.number}</Text>
              <Text style={styles.status}>{statusText(item.status)}</Text>
            </View>
            <Text style={styles.line}>合計: ¥{Number(item.amount).toFixed(0)}</Text>
            <Text style={styles.line}>住所: {item.snapshotAddress || "-"}</Text>
            <Text style={styles.line}>時間: {item.orderTime || "-"}</Text>
            {item.status === 1 && item.payStatus !== 1 && (
              <Text style={styles.countdown}>{getRemainingText(item)}</Text>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          error ? (
            <View style={styles.center}>
              <Text style={styles.empty}>{error}</Text>
              <Pressable style={styles.retryBtn} onPress={() => fetchList(status)}>
                <Text style={styles.retryText}>再試行</Text>
              </Pressable>
            </View>
          ) : (
            <Text style={styles.empty}>注文履歴がありません</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#f8fafc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  tabRow: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  tab: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 16, backgroundColor: "#eef2ff", marginRight: 8 },
  tabActive: { backgroundColor: "#2563eb" },
  tabText: { color: "#111827", fontSize: 12, fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  list: { padding: 12, gap: 10, paddingBottom: 24 },
  card: { backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e5e7eb", padding: 12, gap: 6 },
  row: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  orderNo: { color: "#111827", fontWeight: "700" },
  status: { color: "#2563eb", fontWeight: "700" },
  line: { color: "#4b5563", fontSize: 13 },
  countdown: { color: "#dc2626", fontWeight: "700", fontSize: 13, marginTop: 2 },
  empty: { marginTop: 36, textAlign: "center", color: "#9ca3af" },
  retryBtn: { marginTop: 10, alignSelf: "center", backgroundColor: "#2563eb", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  retryText: { color: "#fff", fontWeight: "700" },
});

