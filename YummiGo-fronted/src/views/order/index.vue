<script setup lang="ts">
import { ref, reactive, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import Empty from '@/components/Empty.vue'
import {
  getOrderDetailPageAPI,
  queryOrderDetailByIdAPI,
  completeOrderAPI,
  deliveryOrderAPI,
  orderCancelAPI,
  orderRejectAPI,
  orderAcceptAPI,
  getOrderListByAPI,
} from '@/api/order'
import type { Order, OrderVO } from '@/types/order'
import { ElMessage } from 'element-plus'
import { resolveImageUrl as resolveImageUrlByRule } from '@/utils/image'
import { normalizeOrderId, normalizeOrderRecord, resolveActiveOrderId } from '@/utils/orderId'
import { useOrderNotifyStore } from '@/store/orderNotify'

/** 取消／拒单ダイアログのモード（日本語で統一し比較に使用） */
const DLG_CANCEL = 'キャンセル'
const DLG_REJECT = '拒否'
const REASON_CUSTOM = 'カスタム'

type OrderStatics = {
  toBeConfirmed: number
  confirmed: number
  deliveryInProgress: number
}

const defaultActivity = ref(0)
const orderStatics = ref<OrderStatics>()
const my_row = ref<Order>()
const acceptLoading = ref(false)
const isAutoNext = ref(true)
const isTableOperateBtn = ref(true)
// const currentPageIndex = ref(0) //记录查看详情数据的index
/** 订单主键（Snowflake），全程用字符串，禁止 Number(id) */
const orderId = ref<string>('')
const input = ref('') //搜索条件的订单号
const phone = ref('') //搜索条件的手机号
const rangeTime = ref<[Date, Date]>()
const dialogVisible = ref(false) //详情弹窗
const cancelDialogVisible = ref(false) //取消，拒单弹窗
const cancelDialogTitle = ref('') //取消，拒绝弹窗标题
const cancelReason = ref('')
const remark = ref('') //自定义原因
const counts = ref(0)
const page = ref(1)
const pageSize = ref(10)
const tableData = ref<Array<any>>([])
const diaForm = ref<OrderVO | null>(null)
const isSearch = ref(false)
const orderStatus = ref(0) //列表字段展示所需订单状态,用于分页请求数据
const dialogOrderStatus = ref(0) //弹窗所需订单状态，用于详情展示字段
// 拒单原因列表
const rejectReasonList = reactive([
  { value: 1, label: '注文が集中しているため一時受付できません', },
  { value: 2, label: '該当商品は売り切れのため受付できません', },
  { value: 3, label: '閉店のため受付できません', },
  { value: 0, label: REASON_CUSTOM, },
])
// 取消订单原因列表
const cancelrReasonList = reactive([
  { value: 1, label: '注文が集中しているため一時受付できません' },
  { value: 2, label: '該当商品は売り切れのため受付できません', },
  { value: 3, label: '配達員不足のため対応できません', },
  { value: 4, label: 'お客様都合（電話）', },
  { value: 0, label: REASON_CUSTOM, },
])
// 订单所有状态列表
const orderList = reactive([
  { label: 'すべて', value: 0, },
  { label: '支払い待ち', value: 1, },
  { label: '受付待ち', value: 2, },
  { label: '配達待ち', value: 3, },
  { label: '配達中', value: 4, },
  { label: '完了', value: 5, },
  { label: 'キャンセル', value: 6, },
])
// tab栏订单状态列表
const changedOrderList = reactive([
  { label: 'すべて', value: 0 },
  { label: '受付待ち', value: 2, num: orderStatics.value?.toBeConfirmed },
  { label: '配達待ち', value: 3, num: orderStatics.value?.confirmed },
  { label: '配達中', value: 4, num: orderStatics.value?.deliveryInProgress },
  { label: '完了', value: 5 },
  { label: 'キャンセル', value: 6 },
])

const activeIndex = ref(0)
// 后端已适配 /order/cancel 后可启用取消订单
const isMerchantCancelEnabled = true

// 监视订单数量变化
watch(orderStatics, (newValue) => {
  console.log('watch订单数量变化：', newValue)
  changedOrderList[1].num = newValue && newValue.toBeConfirmed
  changedOrderList[2].num = newValue && newValue.confirmed
  changedOrderList[3].num = newValue && newValue.deliveryInProgress
})

const tabChange = (index: number) => {
  console.log('tabChange,新的activeIndex：', index)
  activeIndex.value = index
  init(index)
}

const route = useRoute()
const router = useRouter()
const orderNotifyStore = useOrderNotifyStore()

const toAmount = (value: unknown) => {
  const n = Number(value)
  return Number.isFinite(n) ? n : 0
}
const formatJPY = (value: unknown) => `￥${Math.round(toAmount(value))}`
const getDeliveryFee = (order?: OrderVO | null) => {
  if (!order) return 0
  const candidates = [
    (order as any).deliveryFee,
    (order as any).deliveryAmount,
    (order as any).dispatchAmount,
    (order as any).freight,
  ]
  const direct = candidates.map((item) => toAmount(item)).find((item) => item > 0)
  if (direct && direct > 0) return direct
  const amount = toAmount(order.amount)
  const pack = toAmount(order.packAmount)
  const detailsTotal = (order.orderDetailList || []).reduce((sum, detail) => sum + toAmount(detail.amount), 0)
  const inferred = amount - pack - detailsTotal
  return inferred > 0 ? inferred : 0
}
const getItemsTotal = (order?: OrderVO | null) => {
  if (!order) return 0
  const amount = toAmount(order.amount)
  const pack = toAmount(order.packAmount)
  const delivery = getDeliveryFee(order)
  const subtotal = amount - delivery - pack
  if (subtotal > 0) return subtotal
  return (order.orderDetailList || []).reduce((sum, detail) => sum + toAmount(detail.amount), 0)
}
const resolveImageUrl = resolveImageUrlByRule
const getEstimatedDeliveryLabel = (order?: any) => {
  if (!order) return '-'
  if (order.deliveryStatus === 1) return '即時配達'
  return order.estimatedDeliveryTime || '-'
}
const getTablewareLabel = (order?: any) => {
  if (!order) return '-'
  if (order.tablewareStatus === 1 || order.tablewareNumber === -1) return '不要'
  if (order.tablewareNumber === 0) return '人数分'
  return order.tablewareNumber ?? '-'
}

// 初始化时需要分页查询，展示所有订单
const init = async (tabStatus: number = 0, search?: boolean) => {
  search && (isSearch.value = search)
  // 让当前 tab 与查询状态保持同步
  activeIndex.value = tabStatus
  const params = {
    page: page.value,
    pageSize: pageSize.value,
    number: input.value || undefined,
    phone: phone.value || undefined,
    beginTime: rangeTime.value && rangeTime.value.length > 0 ? rangeTime.value[0] : undefined,
    endTime: rangeTime.value && rangeTime.value.length > 0 ? rangeTime.value[1] : undefined,
    status: tabStatus || undefined,
  }
  try {
    const res = await getOrderDetailPageAPI(params)
    if (res.data.code === 1) {
      tableData.value = (res.data.data.records || []).map((row: any) => normalizeOrderRecord(row))
      orderStatus.value = tabStatus
      counts.value = Number(res.data.data.total)
      await getOrderListBy3Status()
      console.log(tableData.value,orderStatus.value)
      console.log('获取到3种订单状态数量')
      if (
        dialogOrderStatus.value === 2 &&
        orderStatus.value === 2 &&
        isAutoNext.value &&
        !isTableOperateBtn.value &&
        res.data.data.records.length >= 1
      ) {
        const row = res.data.data.records[0]
        await goDetail(row.id, row.status, row)
      }
    } else {
      throw new Error(res.data.message)
    }
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

// 获取订单统计数据（3种状态的数量），进行红色小圆消息显示
const getOrderListBy3Status = async () => {
  try {
    const res = await getOrderListByAPI()
    if (res.data.code === 1) {
      console.log('获取订单统计成功')
      orderStatics.value = res.data.data
      console.log('orderStatics:', orderStatics.value)
      console.log('changedOrderList:', changedOrderList)
    } else {
      throw new Error(res.data.message)
    }
  } catch (err) {
    console.error('请求出错了，getorderlistbyAPI有问题：', err)
  }
}

// 打开对话框，查看订单详情
const goDetail = async (id: unknown, status: number, row?: any) => {
  const detailId = normalizeOrderId(id)
  if (!detailId) {
    ElMessage.error('注文IDが無効です。詳細を表示できません')
    return
  }
  console.log('打开对话框，查看订单详情信息', detailId, status, row)
  orderId.value = detailId
  diaForm.value=null //避免旧数据干扰

  try {
    const res = await queryOrderDetailByIdAPI({ orderId: detailId })
    // diaForm!.value = res.data
    const payload= res.data
    if(payload.code !==1){
      ElMessage.error(payload.message || '詳細の取得に失敗しました')
      return
    }

    diaForm.value = payload.data
    const detailStatus = Number(diaForm.value?.status ?? status)
    console.log('snapshotAddress=', diaForm.value?.snapshotAddress)

    my_row.value = row
      ? normalizeOrderRecord({ ...row, id: detailId, status: detailStatus })
      : { id: detailId, status: detailStatus }
    dialogVisible.value = true
    dialogOrderStatus.value = detailStatus
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

const resolveRowOrderId = (row?: { id?: unknown }) =>
  resolveActiveOrderId({
    detailId: diaForm.value?.id,
    cachedId: orderId.value,
    rowId: row?.id,
  })

// 接单
const orderAccept = async (row?: { id?: unknown; status?: number }) => {
  if (acceptLoading.value) return
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  orderId.value = idStr
  if (row?.status != null) dialogOrderStatus.value = row.status
  acceptLoading.value = true
  try {
    const res = await orderAcceptAPI({ id: idStr })
    if (res.data.code === 1) {
      orderId.value = ''
      dialogVisible.value = false
      await init(orderStatus.value)
      ElMessage.success('注文を受付ました')
    } else {
      throw new Error(res.data.message || res.data.msg || '受付に失敗しました')
    }
  } catch (err: any) {
    console.error('受付に失敗：', err)
    const msg = err?.response?.data?.message || err?.response?.data?.msg || err?.message
    ElMessage.error(msg || '受付に失敗しました')
  } finally {
    acceptLoading.value = false
  }
}

const handleOrderAcceptFromDialog = () => {
  isTableOperateBtn.value = false
  void orderAccept()
}

const handleOrderAcceptFromTable = (row: any) => {
  isTableOperateBtn.value = true
  void orderAccept(row)
}

const handleDeliveryFromDialog = () => {
  const idStr = resolveRowOrderId()
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  void deliveryOrComplete(3, idStr)
}

const handleCompleteFromDialog = () => {
  const idStr = resolveRowOrderId()
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  void deliveryOrComplete(4, idStr)
}

// 打开拒单弹窗
const orderReject = (row?: { id?: unknown; status?: number }) => {
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  cancelDialogVisible.value = true
  orderId.value = idStr
  if (row?.status != null) dialogOrderStatus.value = row.status
  cancelDialogTitle.value = DLG_REJECT
  dialogVisible.value = false
  cancelReason.value = ''
}

const handleOrderRejectFromDialog = () => {
  isTableOperateBtn.value = false
  orderReject()
}

const handleCancelFromDialog = () => {
  cancelOrder()
}

const handleRejectFromTable = (row: any) => {
  isTableOperateBtn.value = true
  orderReject(row)
}

// 打开取消订单弹窗
const cancelOrder = (row?: { id?: unknown; status?: number }) => {
  if (!isMerchantCancelEnabled) {
    ElMessage.warning('キャンセルAPIが未設定です。バックエンド連携後に有効にしてください')
    return
  }
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  cancelDialogVisible.value = true
  orderId.value = idStr
  if (row?.status != null) dialogOrderStatus.value = row.status
  cancelDialogTitle.value = DLG_CANCEL
  dialogVisible.value = false
  cancelReason.value = ''
}

// 确认取消订单或拒单
const confirmCancel = async () => {
  if (cancelDialogTitle.value === DLG_CANCEL && !isMerchantCancelEnabled) {
    ElMessage.warning('現在はキャンセルAPI未対応のため、拒否のみ利用可能です')
    cancelDialogVisible.value = false
    return
  }
  if (!cancelReason.value) {
    return ElMessage.error(`${cancelDialogTitle.value}の理由を選択してください`)
  } else if (cancelReason.value === REASON_CUSTOM && !remark.value) {
    return ElMessage.error(`${cancelDialogTitle.value}の理由を入力してください`)
  }
  const idStr = normalizeOrderId(orderId.value)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  try {
    const res = await (cancelDialogTitle.value === DLG_CANCEL ? orderCancelAPI : orderRejectAPI)({
      id: idStr,
      [cancelDialogTitle.value === DLG_CANCEL ? 'cancelReason' : 'rejectionReason']:
        cancelReason.value === REASON_CUSTOM ? remark.value : cancelReason.value,
    })
    if (res.data.code === 1) {
      console.log('操作成功')
      ElMessage.success(cancelDialogTitle.value === DLG_CANCEL ? 'キャンセルしました' : '拒否しました')
      cancelDialogVisible.value = false
      orderId.value = ''
      // 刷新页面
      await init(orderStatus.value)
    } else {
      throw new Error(res.data.message)
    }
  } catch (err: any) {
    console.error('拒否/キャンセルに失敗：', err)
    ElMessage.error(err?.message || '操作に失敗しました')
  }
}

// 派送或完成订单
const deliveryOrComplete = async (status: number, id: string | number) => {
  const idStr = normalizeOrderId(id)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  const params = { status, id: idStr }
  try {
    const res = await (status === 3 ? deliveryOrderAPI : completeOrderAPI)(params)
    if (res.data.code === 1) {
      console.log('操作成功')
      ElMessage.success(status === 3 ? '配達に回しました' : '注文を完了しました')
      orderId.value = ''
      dialogVisible.value = false
      // 刷新页面
      await init(orderStatus.value)
    } else {
      throw new Error(res.data.message)
    }
  } catch (err) {
    console.error('请求出错了：', err)
  }
}

const handleClose = () => {
  dialogVisible.value = false
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  init(orderStatus.value)
}

const handleCurrentChange = (val: number) => {
  page.value = val
  init(orderStatus.value)
}

const initFun = (orderStatus: any) => {
  page.value = 1
  init(orderStatus)
}

const getOrderType = (row: any) => {
  if (row.status === 1) {
    return '支払い待ち'
  } else if (row.status === 2) {
    return '受付待ち'
  } else if (row.status === 3) {
    return '配達待ち'
  } else if (row.status === 4) {
    return '配達中'
  } else if (row.status === 5) {
    return '完了'
  } else if (row.status === 6) {
    return 'キャンセル'
  } else {
    return '返金'
  }
}


// init不够，还得在mounted里面再执行一遍，获取订单统计才行！
const routeStatus = Number(route.query.status) || 0
activeIndex.value = routeStatus
init(routeStatus)

watch(
  () => orderNotifyStore.tick,
  (tick) => {
    if (tick <= 0) return
    void init(orderStatus.value)
    void getOrderListBy3Status()
  }
)

onMounted(async () => {
  if (route.query.status) defaultActivity.value = Number(route.query.status)
  await getOrderListBy3Status()
  // 如果路径中有orderId值，说明是点击右上角消息通知进来的
  const qid = route.query.orderId
  const queryOrderId = normalizeOrderId(Array.isArray(qid) ? qid[0] : qid)
  if (queryOrderId) {
    const queryStatus = Number(route.query.status) || 2
    await goDetail(queryOrderId, queryStatus)
    router.replace({ path: '/order', query: { status: String(orderStatus.value || queryStatus) } })
  }
})
</script>

<template>
  <div class="dashboard-container">
    <div class="tab-change">
      <div v-for="item in changedOrderList" :key="item.value" class="tab-item"
        :class="{ active: item.value === activeIndex }" @click="tabChange(item.value)">
        <el-badge :class="{ 'special-item': item.num && item.num < 10 }" class="item"
          :value="item.num && item.num > 99 ? '99+' : item.num" :hidden="!([2, 3, 4].includes(item.value) && item.num)">
          {{ item.label }}
        </el-badge>
      </div>
    </div>
    <div class="container" :class="{ hContainer: tableData.length }">
      <!-- 搜索项 -->
      <div class="tableBar">
        <label style="margin-right: 5px; font-size: 14px;">注文番号：</label>
        <el-input v-model="input" placeholder="注文番号" style="width: 15%" clearable @clear="init(orderStatus)"
          @keyup.enter="initFun(orderStatus)" />
        <label style="margin: 0 5px 0 30px; font-size: 14px;">電話番号：</label>
        <el-input v-model="phone" placeholder="電話番号" style="width: 15%" clearable @clear="init(orderStatus)"
          @keyup.enter="initFun(orderStatus)" />
        <label style="margin: 0 5px 0 30px; font-size: 14px;">注文日時：</label>
        <el-date-picker v-model="rangeTime" clearable format="YYYY/MM/DD" value-format="YYYY-MM-DD HH:mm:ss"
          range-separator="〜" :default-time="rangeTime" type="daterange" start-placeholder="開始日" end-placeholder="終了日"
          style="width: 25%; margin-left: 10px" @clear="init(orderStatus)" />
        <el-button class="normal-btn continue" @click="init(orderStatus, true)">検索</el-button>
      </div>
      <el-table v-if="tableData.length" :data="tableData" stripe class="tableBox">
        <el-table-column key="number" prop="number" label="注文番号" />
        <el-table-column v-if="[2, 3, 4].includes(orderStatus)" key="orderDishes" prop="orderDishes" label="内容" />
        <el-table-column v-if="[0].includes(orderStatus)" key="status" prop="status" label="ステータス">
          <template v-slot="{ row }">
            <span>{{ getOrderType(row) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="[0, 5, 6].includes(orderStatus)" key="consignee" prop="snapshotConsignee" label="お客様名"
          show-overflow-tooltip />
        <el-table-column v-if="[0, 5, 6].includes(orderStatus)" key="phone" prop="snapshotPhone" label="電話番号" />
        <el-table-column v-if="[0, 2, 3, 4, 5, 6].includes(orderStatus)" key="address" prop="snapshotAddress" label="住所"
          :class-name="orderStatus === 6 ? 'address' : ''" />
        <el-table-column v-if="[0, 6].includes(orderStatus)" key="orderTime" prop="orderTime" label="注文日時"
          class-name="orderTime" min-width="110" />
        <el-table-column v-if="[6].includes(orderStatus)" key="cancelTime" prop="cancelTime" class-name="cancelTime"
          label="キャンセル日時" min-width="110" />
        <el-table-column v-if="[6].includes(orderStatus)" key="cancelReason" prop="cancelReason" label="キャンセル理由"
          class-name="cancelReason" :min-width="[6].includes(orderStatus) ? 80 : 'auto'" />
        <el-table-column v-if="[5].includes(orderStatus)" key="deliveryTime" prop="deliveryTime" label="配達完了日時" />
        <el-table-column v-if="[2, 3, 4].includes(orderStatus)" key="estimatedDeliveryTime" prop="estimatedDeliveryTime"
          label="お届け予定" min-width="110" align="center">
          <template #default="scope">
            {{ getEstimatedDeliveryLabel(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column v-if="[0, 2, 5].includes(orderStatus)" key="amount" prop="amount" label="金額" align="center">
          <template v-slot="{ row }">
            <span>{{ formatJPY(row.amount) }}</span>
          </template>
        </el-table-column>
        <el-table-column v-if="[2, 3, 4, 5].includes(orderStatus)" key="remark" prop="remark" label="備考"
          align="center" />
        <el-table-column v-if="[0, 2, 3, 4, 5].includes(orderStatus)" key="tablewareNumber" prop="tablewareNumber"
          label="カトラリー" align="center" min-width="80">
          <template #default="scope">
            {{ getTablewareLabel(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column prop="btn" label="アクション" align="center" width="198px"
          :class-name="orderStatus === 0 ? 'operate' : 'otherOperate'" :min-width="[2, 3, 4].includes(orderStatus)
            ? 130 : [0].includes(orderStatus) ? 140 : 'auto'">
          <template #default="scope">

            <div class="btn_box">
              <div class="before">
                <el-button v-if="scope.row.status === 2" type="primary" link
                  @click="handleOrderAcceptFromTable(scope.row)">
                  受付
                </el-button>
                <el-button v-if="scope.row.status === 3" type="primary" link
                  @click="deliveryOrComplete(3, scope.row.id)">
                  配達へ
                </el-button>
                <el-button v-if="scope.row.status === 4" type="primary" link
                  @click="deliveryOrComplete(4, scope.row.id)">
                  完了
                </el-button>
              </div>
              <el-divider direction="vertical" />
              <div class="middle">
                <el-button v-if="scope.row.status === 2" type="danger" link
                  @click="handleRejectFromTable(scope.row)">
                  拒否
                </el-button>
                <el-button v-if="[1, 3, 4].includes(scope.row.status)" type="danger" link
                  @click="cancelOrder(scope.row)">
                  キャンセル
                </el-button>
              </div>
              <el-divider direction="vertical" />
              <div class="after">
                <el-button type="primary" link class="blueBtn"
                  @click="goDetail(scope.row.id, scope.row.status, scope.row)">
                  詳細
                </el-button>
              </div>
            </div>

          </template>
        </el-table-column>
      </el-table>
      <Empty v-else :is-search="isSearch" />
      <el-pagination v-if="counts > 10" class="pageList" :page-sizes="[10, 20, 30, 40]" :page-size="pageSize"
        layout="total, sizes, prev, pager, next, jumper" :total="counts" @size-change="handleSizeChange"
        @current-change="handleCurrentChange" />
    </div>

    <!-- 查看dialog弹框部分 -->
    <el-dialog title="注文詳細" v-model="dialogVisible" width="53%" :before-close="handleClose" class="order-dialog">
      <el-scrollbar style="height: 100%">
        <div class="order-top">
          <div>
            <div style="display: inline-block">
              <label style="font-size: 16px">注文番号：</label>
              <div class="order-num">
                {{ diaForm!.number }}
              </div>
            </div>
            <div style="display: inline-block" class="order-status"
              :class="{ status3: [3, 4].includes(dialogOrderStatus) }">
              {{
              orderList.filter((item) => item.value === dialogOrderStatus)[0]
              .label
              }}
            </div>
          </div>
          <p><label>注文日時：</label>{{ diaForm!.orderTime }}</p>
        </div>

        <div class="order-middle">
          <div class="user-info">
            <div class="user-info-box">
              <div class="user-name">
                <label>お客様名：</label>
                <span>{{ diaForm?.snapshotUserName || diaForm?.snapshotConsignee }}</span>
              </div>
              <div class="user-phone">
                <label>電話番号：</label>
                <span>{{ diaForm?.snapshotPhone }}</span>
              </div>
              <div v-if="[2, 3, 4, 5].includes(dialogOrderStatus)" class="user-getTime">
                <label>{{
                  dialogOrderStatus === 5 ? '配達完了：' : 'お届け予定：'
                  }}</label>
                <span>{{
                  dialogOrderStatus === 5
                  ? diaForm!.deliveryTime
                  : getEstimatedDeliveryLabel(diaForm)
                  }}</span>
              </div>
              <div v-if="[2, 3, 4, 5].includes(dialogOrderStatus)" class="user-getTime">
                <label>カトラリー：</label>
                <span>{{ getTablewareLabel(diaForm) }}</span>
              </div>
              <div class="user-address">
                <label>住所：</label>
                <span>{{ diaForm?.snapshotAddress }}</span>
              </div>
            </div>
            <div class="user-remark" :class="{ orderCancel: dialogOrderStatus === 6 }">
              <div>{{ dialogOrderStatus === 6 ? 'キャンセル理由' : '備考' }}</div>
              <span>{{
                dialogOrderStatus === 6
                ? diaForm!.cancelReason || diaForm!.rejectionReason
                : diaForm!.remark
                }}</span>
            </div>
          </div>

          <div class="dish-info">
            <div class="dish-label">商品</div>
            <div class="dish-list">
              <div v-for="(item, index) in diaForm!.orderDetailList" :key="index" class="dish-item">
                <img
                  v-if="item.image || item.pic"
                  class="dish-thumb"
                  :src="resolveImageUrl(item.image || item.pic)"
                  alt=""
                />
                <div class="dish-item-box">
                  <span class="dish-name">{{ item.name }}</span>
                  <span v-if="item.dishFlavor" class="dish-flavor">（{{ item.dishFlavor }}）</span>
                  <span class="dish-num">x{{ item.number }}</span>
                </div>
                <span class="dish-price">{{ formatJPY(item.amount) }}</span>
              </div>
            </div>
            <div class="dish-all-amount">
              <label>小計</label>
              <span>{{ formatJPY(getItemsTotal(diaForm)) }}</span>
            </div>
          </div>
        </div>

        <div class="order-bottom">
          <div class="amount-info">
            <div class="amount-label">料金</div>
            <div class="amount-list">
              <div class="dish-amount">
                <span class="amount-name">小計：</span>
                <span class="amount-price">{{ formatJPY(getItemsTotal(diaForm)) }}</span>
              </div>
              <div class="send-amount">
                <span class="amount-name">配達料：</span>
                <span class="amount-price">{{ formatJPY(getDeliveryFee(diaForm)) }}</span>
              </div>
              <div class="package-amount">
                <span class="amount-name">梱包料：</span>
                <span class="amount-price">{{ formatJPY(diaForm?.packAmount) }}</span>
              </div>
              <div class="all-amount">
                <span class="amount-name">合計：</span>
                <span class="amount-price">{{ formatJPY(diaForm?.amount) }}</span>
              </div>
              <div class="pay-type">
                <span class="pay-name">決済方法：</span>
                <span class="pay-value">{{
                  diaForm!.payMethod === 1 ? 'WeChat Pay' : diaForm!.payMethod === 2 ? 'Stripe 等' : 'その他'
                  }}</span>
              </div>
              <div class="pay-time">
                <span class="pay-name">決済日時：</span>
                <span class="pay-value">{{ diaForm!.checkoutTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <template #footer>
        <span v-if="dialogOrderStatus !== 6" class="dialog-footer">
          <el-checkbox v-if="dialogOrderStatus === 2 && orderStatus === 2" v-model="isAutoNext">処理後、次の注文へ自動表示</el-checkbox>
          <div>
            <el-button v-if="dialogOrderStatus === 2" @click="handleOrderRejectFromDialog">拒否</el-button>
            <el-button
              v-if="dialogOrderStatus === 2"
              type="primary"
              :loading="acceptLoading"
              @click="handleOrderAcceptFromDialog"
            >受付</el-button>

            <el-button v-if="[1, 3, 4, 5].includes(dialogOrderStatus)" @click="dialogVisible = false">閉じる</el-button>
            <el-button v-if="dialogOrderStatus === 3" type="primary" @click="handleDeliveryFromDialog">配達へ</el-button>
            <el-button v-if="dialogOrderStatus === 4" type="primary" @click="handleCompleteFromDialog">完了</el-button>
            <el-button v-if="[1].includes(dialogOrderStatus)" type="primary"
              @click="handleCancelFromDialog">注文をキャンセル</el-button>
          </div>
        </span>
      </template>
    </el-dialog>

    <!-- 点击拒单，弹出 填拒单/取消原因 的弹窗 -->
    <el-dialog :title="cancelDialogTitle + '理由'" v-model="cancelDialogVisible" width="42%"
      :before-close="() => ((cancelDialogVisible = false), (cancelReason = ''))" class="cancelDialog">
      <el-form label-width="90px">
        <el-form-item :label="cancelDialogTitle + '理由'">
          <el-select v-model="cancelReason" :placeholder="cancelDialogTitle + 'の理由を選択'">
            <el-option v-for="(item, index) in cancelDialogTitle === DLG_CANCEL
              ? cancelrReasonList
              : rejectReasonList" :key="index" :label="item.label" :value="item.label" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="cancelReason === REASON_CUSTOM" label="詳細">
          <el-input v-model.trim="remark" type="textarea" :placeholder="cancelDialogTitle + 'の理由（20文字以内）'"
            maxlength="20" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="; (cancelDialogVisible = false), (cancelReason = '')">キャンセル</el-button>
          <el-button type="primary" @click="confirmCancel">確定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>


<style lang="less" scoped>
.tab-change {
  display: flex;
  border-radius: 4px;
  margin-bottom: 20px;

  .tab-item {
    width: 120px;
    height: 40px;
    text-align: center;
    line-height: 40px;
    color: #333;
    border: 1px solid #e5e4e4;
    background-color: white;
    border-left: none;
    cursor: pointer;

    .special-item {
      .el-badge__content {
        width: 20px;
        padding: 0 5px;
      }
    }

    .item {
      :deep(.el-badge__content) {
        background-color: #ff4433 !important;
        line-height: 15px;
        height: auto;
        min-width: 18px;
        min-height: 18px;
        // border-radius: 50%;
      }

      :deep(.el-badge__content.is-fixed) {
        top: 14px;
        right: 2px;
      }
    }
  }

  .active {
    background-color: #22ccff;
    font-weight: bold;
  }

  .tab-item:first-child {
    border-left: 1px solid #e5e4e4;
  }
}

.dashboard {
  &-container {
    margin: 30px;
    // height: 100%;
    min-height: 700px;

    .container {
      background: #fff;
      position: relative;
      z-index: 1;
      padding: 30px 28px;
      border-radius: 4px;
      // min-height: 650px;
      height: calc(100% - 55px);

      .tableBar {
        // display: flex;
        margin-bottom: 20px;
        justify-content: space-between;

        .tableLab {
          span {
            cursor: pointer;
            display: inline-block;
            font-size: 14px;
            padding: 0 20px;
            color: gray;
            border-right: solid 1px gray;
          }
        }
      }

      .tableBox {
        width: 100%;
        border: 1px solid #e4e4e4;
        border-bottom: 0;
        display: flex;
        flex-direction: row;

        .btn_box {
          display: grid;
          grid-template-columns: 40px 1px 54px 1px 40px;
          align-items: center;
          justify-content: center;
          height: 100%;

          .before,
          .after {
            min-width: 0;
            margin: 0;
            text-align: center;
            white-space: nowrap;
            display: flex;
            justify-content: center;
          }

          .middle {
            min-width: 0;
            margin: 0;
            text-align: center;
            white-space: nowrap;
            display: flex;
            justify-content: center;
          }

          .el-divider--vertical {
            margin: 0;
            height: 16px;
          }
        }
      }

      .pageList {
        justify-content: center;
        text-align: center;
        margin-top: 30px;
      }

      //查询黑色按钮样式
      .normal-btn {
        background: #333333;
        color: white;
        margin-left: 20px;
      }
    }

    .hContainer {
      height: auto !important;
    }
  }
}

.search-btn {
  margin-left: 20px;
}

.info-box {
  margin: -15px -44px 20px;

  p {
    display: flex;
    height: 20px;
    line-height: 20px;
    font-size: 14px;
    font-weight: 400;
    color: #666666;
    text-align: left;
    margin-bottom: 14px;

    &:last-child {
      margin-bottom: 0;
    }

    label {
      width: 100px;
      display: inline-block;
      color: #666;
    }

    .des {
      flex: 1;
      color: #333333;
    }
  }
}

.order-top {
  // height: 80px;
  border-bottom: 1px solid #e7e6e6;
  padding-bottom: 26px;
  padding-left: 22px;
  padding-right: 22px;
  // margin: 0 30px;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .order-status {
    width: 57.25px;
    height: 27px;
    background: #333333;
    border-radius: 13.5px;
    color: white;
    margin-left: 19px;
    text-align: center;
    line-height: 27px;
  }

  .status3 {
    background: #f56c6c;
  }

  p {
    color: #333;

    label {
      color: #666;
    }
  }

  .order-num {
    font-size: 16px;
    color: #2a2929;
    font-weight: bold;
    display: inline-block;
  }
}

.order-middle {
  .user-info {
    min-height: 140px;
    background: #fbfbfa;
    margin-top: 10px;

    padding: 10px 43px;
    color: #333;

    .user-info-box {
      text-align: left;
      min-height: 30px;
      display: flex;
      flex-wrap: wrap;

      .user-name {
        flex: 67%;
      }

      .user-phone {
        flex: 33%;
      }

      .user-getTime {
        margin-top: 10px;
        flex: 80%;

        label {
          margin-right: 3px;
        }
      }

      label {
        margin-right: 17px;
        color: #666;
      }

      .user-address {
        margin-top: 14px;
        flex: 80%;

        label {
          margin-right: 30px;
        }
      }
    }

    .user-remark {
      min-height: 43px;
      line-height: 43px;
      background: #f0fbff;
      border: 1px solid #88eeff;
      border-radius: 4px;
      margin-top: 10px;
      padding: 6px;
      display: flex;
      align-items: center;

      div {
        display: inline-block;
        min-width: 53px;
        height: 32px;
        background: #88eeff;
        border-radius: 4px;
        text-align: center;
        line-height: 32px;
        color: #333;
        margin-right: 30px;
        // padding: 12px 6px;
      }

      span {
        color: #22ccff;
        line-height: 1.15;
      }
    }

    .orderCancel {
      background: #ffffff;
      border: 1px solid #b6b6b6;

      div {
        padding: 0 10px;
        background-color: #e5e4e4;
      }

      span {
        color: #f56c6c;
      }
    }
  }

  .dish-info {
    // min-height: 180px;
    display: flex;
    flex-wrap: wrap;
    padding: 20px 40px;
    border-bottom: 1px solid #e7e6e6;

    .dish-label {
      color: #666;
    }

    .dish-list {
      flex: 80%;
      display: flex;
      flex-wrap: wrap;

      .dish-item {
        flex: 50%;
        margin-bottom: 14px;
        color: #333;
        display: flex;
        align-items: center;
        gap: 10px;

        .dish-thumb {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 4px;
          flex-shrink: 0;
          border: 1px solid #eee;
        }

        .dish-item-box {
          display: inline-block;
          flex: 1;
          min-width: 0;
        }

        .dish-flavor {
          color: #888;
          font-size: 12px;
        }
      }
    }

    .dish-label {
      margin-right: 65px;
    }

    .dish-all-amount {
      flex: 1;
      padding-left: 92px;
      margin-top: 10px;

      label {
        color: #333333;
        font-weight: bold;
        margin-right: 5px;
      }

      span {
        color: #f56c6c;
      }
    }
  }
}

.order-bottom {
  .amount-info {
    // min-height: 180px;
    display: flex;
    flex-wrap: wrap;
    padding: 20px 40px;
    padding-bottom: 0px;

    .amount-label {
      color: #666;
      margin-right: 65px;
    }

    .amount-list {
      flex: 80%;
      display: flex;
      flex-wrap: wrap;
      color: #333;

      // height: 65px;
      .dish-amount,
      .package-amount,
      .pay-type {
        display: inline-block;
        width: 300px;
        margin-bottom: 14px;
        flex: 50%;
      }

      .send-amount,
      .all-amount,
      .pay-time {
        display: inline-block;
        flex: 50%;
        padding-left: 10%;
      }

      .package-amount {
        .amount-name {
          margin-right: 14px;
        }
      }

      .all-amount {
        .amount-name {
          margin-right: 24px;
        }

        .amount-price {
          color: #f56c6c;
        }
      }

      .send-amount {
        .amount-name {
          margin-right: 10px;
        }
      }
    }
  }
}

:deep(.el-table tr) {
  font-size: 12px;
}

.dialog-footer {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;

  .blueBtn {
    background: #409eff;
    color: white;
  }
}
</style>