import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
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

const SIDEBAR_WIDTH = 88;

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

function statusColor(status: number) {
  switch (status) {
    case 1:
      return "#dc2626";
    case 2:
      return "#f59e0b";
    case 3:
    case 4:
      return "#2563eb";
    case 5:
      return "#16a34a";
    case 6:
      return "#9ca3af";
    default:
      return "#6b7280";
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
    const inWindow = candidates.filter((ts) => now >= ts && now - ts <= windowMs);
    if (inWindow.length > 0) return Math.max(...inWindow);
    const notFuture = candidates.filter((ts) => ts <= now + 60 * 1000);
    if (notFuture.length > 0) return Math.max(...notFuture);
    return Math.min(...candidates);
  };

  const getRemainingText = (item: OrderVO) => {
    if (item.status !== 1 || item.payStatus === 1) return "";
    const createdMs = resolveOrderStartMs(item.orderTime);
    if (Number.isNaN(createdMs)) return "残り --:--";
    const left = Math.max(0, Math.floor((createdMs + 15 * 60 * 1000 - nowMs) / 1000));
    const m = Math.floor(left / 60);
    const s = left % 60;
    return `残り ${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const notifyRejectedOrders = useCallback((records: OrderVO[]) => {
    const freshRejects: string[] = [];
    for (const item of records) {
      const key = String(item.id);
      const prevStatus = statusByIdRef.current.get(key);
      if (shouldNotifyMerchantReject(prevStatus, item)) {
        freshRejects.push(getMerchantRejectReason(item));
      }
      statusByIdRef.current.set(key, item.status);
    }
    if (freshRejects.length === 1) {
      showMerchantRejectAlert(freshRejects[0]);
    } else if (freshRejects.length > 1) {
      showMerchantRejectAlert(`${freshRejects.length}件の注文が店舗により拒否されました。`);
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
    fetchList(0);
  }, [fetchList]);

  useFocusEffect(
    useCallback(() => {
      fetchList(status, true);
      const secondTimer = setInterval(() => setNowMs(Date.now()), 1000);
      const timer = setInterval(() => fetchList(status, true), 15000);
      return () => {
        clearInterval(timer);
        clearInterval(secondTimer);
      };
    }, [fetchList, status])
  );

  const onChangeStatus = async (next: number) => {
    if (next === status) return;
    setStatus(next);
    await fetchList(next);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchList(status, true);
    setRefreshing(false);
  };

  const selectedTabLabel = TABS.find((t) => t.value === status)?.label ?? "すべて";

  const sidebar = (
    <View style={styles.sidebar}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sidebarContent}>
        {TABS.map((item) => {
          const active = item.value === status;
          return (
            <Pressable
              key={item.value}
              style={[styles.tabItem, active && styles.tabItemActive]}
              onPress={() => onChangeStatus(item.value)}
            >
              {active && <View style={styles.tabActiveBar} />}
              <Text style={[styles.tabText, active && styles.tabTextActive]} numberOfLines={3}>
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.page}>
        <View style={styles.mainRow}>
          {sidebar}
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#f59e0b" />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.page}>
      <View style={styles.mainRow}>
        {sidebar}
        <View style={styles.content}>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>{selectedTabLabel}</Text>
            <Text style={styles.contentSub}>{list.length} 件</Text>
          </View>
          <FlatList
            data={list}
            keyExtractor={(item) => String(item.id)}
            contentContainerStyle={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => (
              <Pressable style={styles.card} onPress={() => router.push(`/order/detail?id=${item.id}`)}>
                <View style={styles.cardTop}>
                  <Text style={styles.orderNo} numberOfLines={1}>{item.number}</Text>
                  <Text style={[styles.statusBadge, { color: statusColor(item.status) }]}>
                    {statusText(item.status)}
                  </Text>
                </View>
                <Text style={styles.amount}>¥{Number(item.amount).toFixed(0)}</Text>
                <Text style={styles.line} numberOfLines={2}>{item.snapshotAddress || "-"}</Text>
                <Text style={styles.time}>{item.orderTime || "-"}</Text>
                {item.status === 1 && item.payStatus !== 1 && (
                  <Text style={styles.countdown}>{getRemainingText(item)}</Text>
                )}
              </Pressable>
            )}
            ListEmptyComponent={
              error ? (
                <View style={styles.emptyBox}>
                  <Text style={styles.empty}>{error}</Text>
                  <Pressable style={styles.retryBtn} onPress={() => fetchList(status)}>
                    <Text style={styles.retryText}>再試行</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.emptyBox}>
                  <Text style={styles.empty}>注文履歴がありません</Text>
                </View>
              )
            }
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: "#fff" },
  mainRow: { flex: 1, flexDirection: "row" },
  sidebar: {
    width: SIDEBAR_WIDTH,
    backgroundColor: "#f3f4f6",
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "#e5e7eb",
  },
  sidebarContent: { paddingBottom: 24 },
  tabItem: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: 8,
    paddingVertical: 12,
    position: "relative",
  },
  tabItemActive: { backgroundColor: "#fff" },
  tabActiveBar: {
    position: "absolute",
    left: 0,
    top: 10,
    bottom: 10,
    width: 3,
    borderRadius: 2,
    backgroundColor: "#f59e0b",
  },
  tabText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    lineHeight: 16,
    fontWeight: "600",
  },
  tabTextActive: { color: "#111827", fontWeight: "800" },
  content: { flex: 1, backgroundColor: "#fff" },
  contentHeader: {
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  contentTitle: { fontSize: 17, fontWeight: "800", color: "#111827" },
  contentSub: { marginTop: 2, fontSize: 12, color: "#9ca3af" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 12, paddingBottom: 24, flexGrow: 1 },
  separator: { height: 10 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e5e7eb",
    padding: 12,
    gap: 4,
  },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 },
  orderNo: { flex: 1, color: "#111827", fontWeight: "700", fontSize: 14 },
  statusBadge: { fontSize: 12, fontWeight: "800" },
  amount: { fontSize: 18, fontWeight: "800", color: "#111827", marginTop: 2 },
  line: { color: "#6b7280", fontSize: 13, lineHeight: 18 },
  time: { color: "#9ca3af", fontSize: 12 },
  countdown: { color: "#dc2626", fontWeight: "700", fontSize: 13, marginTop: 4 },
  emptyBox: { alignItems: "center", paddingTop: 48, gap: 10 },
  empty: { textAlign: "center", color: "#9ca3af", fontSize: 14 },
  retryBtn: { backgroundColor: "#f59e0b", borderRadius: 8, paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { color: "#fff", fontWeight: "700" },
});
