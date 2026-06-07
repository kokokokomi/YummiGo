<template>
  <div>
    <div class="container homecon">
      <h2 class="homeTitle homeTitleBtn">
        注文情報
        <ul class="conTab">
          <li v-for="(item, index) in tabList" :key="index" :class="activeIndex === index ? 'active' : ''"
            @click="handleClass(index)">
            <el-badge class="item" :class="item.num >= 10 ? 'badgeW' : ''" :value="item.num > 99 ? '99+' : item.num"
              :hidden="!([2, 3].includes(item.value) && item.num)">{{ item.label }}</el-badge>
          </li>
        </ul>
      </h2>
      <div>
        <div v-if="orderData.length > 0">
          <el-table :data="orderData" stripe class="tableBox" style="width: 100%">
            <el-table-column prop="number" label="注文番号"></el-table-column>
            <el-table-column label="内容">
              <template #default="scope">
                <div class="ellipsisHidden">
                  <el-popover placement="top-start" width="200" trigger="hover" :content="scope.row.orderDishes">
                    <template v-slot:reference>
                      <span>{{ scope.row.orderDishes }}</span>
                    </template>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="住所" :class-name="dialogOrderStatus === 2 ? 'address' : ''">
              <template #default="scope">
                <div class="ellipsisHidden">
                  <el-popover placement="top-start" width="200" trigger="hover" :content="scope.row.address">
                    <template v-slot:reference>
                      <span>{{ scope.row.address }}</span>
                    </template>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="estimatedDeliveryTime" label="お届け予定" sortable class-name="orderTime"
              min-width="130"></el-table-column>
            <el-table-column prop="amount" label="金額"></el-table-column>
            <el-table-column label="備考">
              <template #default="scope">
                <div class="ellipsisHidden">
                  <el-popover placement="top-start" width="200" trigger="hover" :content="scope.row.remark">
                    <template v-slot:reference>
                      <span>{{ scope.row.remark }}</span>
                    </template>
                  </el-popover>
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="tablewareNumber" label="カトラリー" min-width="80" align="center" v-if="status === 3">
              <template #default="scope">
                {{ scope.row.tablewareNumber === -1 ? '不要' : scope.row.tablewareNumber === 0 ? '人数分' :
                  scope.row.tablewareNumber }}
              </template>
            </el-table-column>
            <el-table-column label="アクション" align="center"
              :class-name="dialogOrderStatus === 0 ? 'operate' : 'otherOperate'" min-width="132px">
              <template #default="scope">
                <div class="before">
                  <el-button v-if="scope.row.status === 2" type="primary" link @click="orderAccept(scope.row)">
                    受付
                  </el-button>
                  <el-button v-if="scope.row.status === 3" type="primary" link
                    @click="deliveryOrComplete(3, scope.row.id)">
                    配達へ
                  </el-button>
                </div>
                <div class="middle">
                  <el-button v-if="scope.row.status === 2" type="danger" link @click="orderReject(scope.row)">
                    拒否
                  </el-button>
                  <el-button v-if="[1, 3, 4, 5].includes(scope.row.status)" type="danger" link
                    @click="cancelOrder(scope.row)">
                    キャンセル
                  </el-button>
                </div>
                <div class="after">
                  <el-button type="primary" link @click="goDetail(scope.row.id, scope.row.status, scope.row)">
                    詳細
                  </el-button>
                </div>
              </template>
            </el-table-column>
          </el-table>
        </div>
        <Empty v-else :is-search="isSearch" />
        <el-pagination v-if="counts > 10" class="pageList" :page-sizes="[10, 20, 30, 40]" :page-size="pageSize"
          layout="total, sizes, prev, pager, next, jumper" :total="counts" @size-change="handleSizeChange"
          @current-change="handleCurrentChange" />
      </div>
    </div>

    <!-- 查看弹框部分 -->
    <el-dialog title="注文情報" v-model="dialogVisible" width="53%" :before-close="handleClose" class="order-dialog">
      <el-scrollbar style="height: 100%">
        <div class="order-top">
          <div>
            <div style="display: inline-block">
              <label style="font-size: 16px">注文番号：</label>
              <div class="order-num">{{ diaForm?.number }}</div>
            </div>
            <div style="display: inline-block" class="order-status"
              :class="{ status3: [3, 4].includes(dialogOrderStatus) }">
              {{
                orderList.filter((item) => item.value === dialogOrderStatus)[0]
                  .label
              }}
            </div>
          </div>
          <p><label>注文日時：</label>{{ diaForm?.orderTime }}</p>
        </div>

        <div class="order-middle">
          <div class="user-info">
            <div class="user-info-box">
              <div class="user-name">
                <label>お客様名：</label>
                <span>{{ diaForm?.snapshotConsignee }}</span>
              </div>
              <div class="user-phone">
                <label>電話番号：</label>
                <span>{{ diaForm?.snapshotPhone }}</span>
              </div>
              <div v-if="[2, 3, 4, 5].includes(dialogOrderStatus)" class="user-getTime">
                <label>{{ dialogOrderStatus === 5 ? '配達完了：' : 'お届け予定：' }}</label>
                <span>{{ dialogOrderStatus === 5 ? diaForm?.deliveryTime : diaForm!.estimatedDeliveryTime }}</span>
              </div>
              <div class="user-address">
                <label>住所：</label>
                <span>{{ diaForm!.snapshotAddress }}</span>
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
                <span class="dish-name">{{ item.name }}</span>
                <span class="dish-num">x{{ item.number }}</span>
                <span class="dish-price">￥{{ item.amount ? item.amount.toFixed(2) : '' }}</span>
              </div>
            </div>
            <div class="dish-all-amount">
              <label>小計</label>
              <span>￥{{ (diaForm!.amount - 6 - (diaForm!.packAmount ?? 0)).toFixed(2) }}</span>
            </div>
          </div>
        </div>

        <div class="order-bottom">
          <div class="amount-info">
            <div class="amount-label">料金</div>
            <div class="amount-list">
              <div class="dish-amount">
                <span class="amount-name">小計：</span>
                <span class="amount-price">￥{{
                  ((((diaForm!.amount - 6 - (diaForm!.packAmount ?? 0)) * 100) / 100)).toFixed(2)
                }}</span>
              </div>
              <div class="send-amount">
                <span class="amount-name">配達料：</span>
                <span class="amount-price">￥6.00</span>
              </div>
              <div class="pack-amount">
                <span class="amount-name">梱包料：</span>
                <span class="amount-price">￥{{ (((diaForm!.packAmount ?? 0) * 100) / 100).toFixed(2) }}</span>
              </div>
              <div class="all-amount">
                <span class="amount-name">合計：</span>
                <span class="amount-price">￥{{ ((diaForm!.amount * 100) / 100).toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
      </el-scrollbar>
      <template #footer>
        <span v-if="dialogOrderStatus !== 6" class="dialog-footer">
          <el-checkbox v-if="dialogOrderStatus === 2 && status === 2" v-model="isAutoNext">処理後、次の注文へ自動表示</el-checkbox>
          <el-button v-if="dialogOrderStatus === 2" @click="handleOrderRejectFromDialog">拒否</el-button>
          <el-button v-if="dialogOrderStatus === 2" type="primary"
            @click="handleOrderAcceptFromDialog">受付</el-button>

          <el-button v-if="[1, 3, 4, 5].includes(dialogOrderStatus)" @click="dialogVisible = false">閉じる</el-button>
          <el-button v-if="dialogOrderStatus === 3" type="primary" @click="handleDeliveryFromDialog">配達へ</el-button>
          <el-button v-if="dialogOrderStatus === 4" type="primary" @click="handleCompleteFromDialog">完了</el-button>
          <el-button v-if="[1].includes(dialogOrderStatus)" type="primary" @click="handleCancelFromDialog">注文をキャンセル</el-button>
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

<script setup lang="ts">
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import Empty from '@/components/Empty.vue';
import {
  getOrderDetailPageAPI,
  queryOrderDetailByIdAPI,
  completeOrderAPI,
  deliveryOrderAPI,
  orderCancelAPI,
  orderRejectAPI,
  orderAcceptAPI,
} from '@/api/order'
import type { Order, OrderVO } from '@/types/order'
import { ElMessage } from 'element-plus'
import { normalizeOrderId, normalizeOrderRecord, resolveActiveOrderId } from '@/utils/orderId'
import { useOrderNotifyStore } from '@/store/orderNotify'
const emit = defineEmits<{
  (e: 'getOrderListBy3Status'): void
}>()

/** ダイアログタイトル・理由比較用（注文ページと整合） */
const DLG_CANCEL = 'キャンセル'
const DLG_REJECT = '拒否'
const REASON_CUSTOM = 'カスタム'

const router = useRouter()
const orderNotifyStore = useOrderNotifyStore()

const orderStatics = ref<any>(''); // 订单统计数据
const orderId = ref<string>(''); // 订单号
const dialogOrderStatus = ref<number>(0); // 弹窗所需订单状态，用于详情展示字段
const activeIndex = ref<number>(0);
const dialogVisible = ref<boolean>(false); // 详情弹窗
const cancelDialogVisible = ref<boolean>(false); // 取消，拒单弹窗
const cancelDialogTitle = ref<string>(''); // 取消，拒绝弹窗标题
const cancelReason = ref<string>('');
const remark = ref<string>(''); // 自定义原因
const diaForm = ref<OrderVO>()
// const row = ref<any>({});
const my_row = ref<Order>()
const isAutoNext = ref<boolean>(false);
const isSearch = ref<boolean>(false);
const counts = ref<number>(0);
const page = ref<number>(1);
const pageSize = ref<number>(10);
const status = ref<number>(2); // 列表字段展示所需订单状态,用于分页请求数据
const orderData = ref<any[]>([]);
const isTableOperateBtn = ref<boolean>(true);

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

const orderList = [
  { label: 'すべて', value: 0 },
  { label: '支払い待ち', value: 1 },
  { label: '受付待ち', value: 2 },
  { label: '配達待ち', value: 3 },
  { label: '配達中', value: 4 },
  { label: '完了', value: 5 },
  { label: 'キャンセル', value: 6 },
];

const tabList = computed(() => [
  { label: '受付待ち', value: 2, num: orderStatics.value.toBeConfirmed },
  { label: '配達待ち', value: 3, num: orderStatics.value.confirmed },
]);

// 获取订单数据
const getOrderListData = async (status: number) => {
  dialogVisible.value = false;
  const params = { page: page.value, pageSize: pageSize.value, status };
  const data = await getOrderDetailPageAPI(params);
  console.log("拿到订单数据了！", data);
  const records = data.data?.data?.records || []
  orderData.value = records.map((row: any) => normalizeOrderRecord(row))
  counts.value = data.data?.data?.total ?? 0
  if (dialogOrderStatus.value === 2 && status === 2 && isAutoNext.value
    && !isTableOperateBtn.value && records.length >= 1) {
    const firstRow = records[0];
    goDetail(firstRow.id, firstRow.status, firstRow);
  }
};

const resolveRowOrderId = (row?: { id?: unknown }) =>
  resolveActiveOrderId({
    detailId: diaForm.value?.id,
    cachedId: orderId.value,
    rowId: row?.id,
  })

// 接单
const orderAccept = async (row?: { id?: unknown; status?: number }) => {
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  orderId.value = idStr
  if (row?.status != null) dialogOrderStatus.value = row.status
  try {
    const res = await orderAcceptAPI({ id: idStr })
    if (res.data.code === 1) {
      orderId.value = ''
      dialogVisible.value = false
      await getOrderListData(status.value)
      emit('getOrderListBy3Status')
      ElMessage.success('注文を受付ました')
    } else {
      throw new Error(res.data.message || res.data.msg)
    }
  } catch (err: any) {
    ElMessage.error(err?.message || '受付に失敗しました')
  }
};

const handleOrderAcceptFromDialog = () => {
  isTableOperateBtn.value = false
  void orderAccept()
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

const handleCancelFromDialog = () => {
  cancelOrder()
}

const cancelOrder = (row?: { id?: unknown; status?: number }) => {
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  cancelDialogVisible.value = true;
  orderId.value = idStr;
  if (row?.status != null) dialogOrderStatus.value = row.status;
  cancelDialogTitle.value = DLG_CANCEL;
  dialogVisible.value = false;
  cancelReason.value = '';
};

const handleOrderRejectFromDialog = () => {
  isTableOperateBtn.value = false
  orderReject()
}

const orderReject = (row?: { id?: unknown; status?: number }) => {
  const idStr = resolveRowOrderId(row)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  cancelDialogVisible.value = true;
  orderId.value = idStr;
  if (row?.status != null) dialogOrderStatus.value = row.status;
  cancelDialogTitle.value = DLG_REJECT;
  dialogVisible.value = false;
  cancelReason.value = '';
};

const confirmCancel = async () => {
  if (!cancelReason.value) {
    return;
  } else if (cancelReason.value === REASON_CUSTOM && !remark.value) {
    return;
  }
  // 判断是取消还是拒单
  const action = cancelDialogTitle.value === DLG_CANCEL ? orderCancelAPI : orderRejectAPI;
  const idStr = normalizeOrderId(orderId.value)
  if (!idStr) {
    ElMessage.error('注文IDが無効です')
    return
  }
  const payload = {
    id: idStr,
    [cancelDialogTitle.value === DLG_CANCEL ? 'cancelReason' : 'rejectionReason']: cancelReason.value === REASON_CUSTOM ? remark.value : cancelReason.value,
  };
  const { data: res } = await action(payload)
  if (res.code === 1) {
    cancelDialogVisible.value = false;
    orderId.value = '';
    ElMessage.success(cancelDialogTitle.value === DLG_CANCEL ? 'キャンセルしました' : '拒否しました')
    await getOrderListData(status.value);
    emit('getOrderListBy3Status')
  } else {
    throw new Error(res.msg)
  }
};

// 派送或完成订单
const deliveryOrComplete = async (status1: number, id: string | number) => {
  const action = status1 === 3 ? deliveryOrderAPI : completeOrderAPI;
  const params = { status1, id };

  const { data: res } = await action(params)
  if (res.code === 1) {
    orderId.value = ''
    dialogVisible.value = false
    ElMessage.success(`${status1 === 3 ? '配達に回しました' : '注文を完了しました'}`)
    await getOrderListData(status.value)
    emit('getOrderListBy3Status')
  } else {
    // Handle error
  }
};

// const goDetail = async (id: any, status: number, row: any) => {
//   dialogVisible.value = true;
//   dialogOrderStatus.value = status;
//   const { data: res } = await queryOrderDetailByIdAPI({ orderId: id });
//   diaForm.value = res.data;
//   row.value = row;
// };

// 打开对话框，查看订单详情
const goDetail = async (id: unknown, status: number, row?: any) => {
  const detailId = normalizeOrderId(id)
  if (!detailId) {
    ElMessage.error('注文IDが無効です')
    return
  }
  orderId.value = detailId
  const res = await queryOrderDetailByIdAPI({ orderId: detailId })
  const payload = res.data
  if (payload.code !== 1) {
    ElMessage.error(payload.message || '詳細の取得に失敗しました')
    return
  }
  diaForm.value = payload.data
  const detailStatus = Number(diaForm.value?.status ?? status)
  my_row.value = row
    ? normalizeOrderRecord({ ...row, id: detailId, status: detailStatus })
    : { id: detailId, status: detailStatus }
  dialogVisible.value = true
  dialogOrderStatus.value = detailStatus
}

const handleClose = () => {
  dialogVisible.value = false;
};

const handleClass = (index: number) => {
  activeIndex.value = index;
  status.value = index === 0 ? 2 : 3;
  getOrderListData(status.value);
};

const handleSizeChange = (val: number) => {
  pageSize.value = val;
  getOrderListData(status.value);
};

const handleCurrentChange = (val: number) => {
  page.value = val;
  getOrderListData(status.value);
};

watch(
  () => orderNotifyStore.tick,
  (tick) => {
    if (tick <= 0) return
    void getOrderListData(status.value)
    emit('getOrderListBy3Status')
  }
)

onMounted(() => {
  getOrderListData(status.value);
});

</script>

<style lang="less" scoped>
.dashboard-container.home .homecon {
  margin-bottom: 0;
}

.tableBox {
  width: 100%;
  border: 1px solid #e4e4e4;
  border-bottom: 0;
  display: flex;
  flex-direction: row;

  .btn_box {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;

    .before,
    .after {
      width: 40px;
      margin: 2px;
      text-align: center;
      white-space: nowrap;
    }

    .middle {
      width: 54px;
      margin: 2px 4px;
      text-align: center;
      white-space: nowrap;
    }
  }
  .before,
  .middle,
  .after {
    width: 40px;
    margin: 2px;
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
    margin-top: 23px;

    padding: 20px 43px;
    color: #333;

    .user-info-box {
      min-height: 55px;
      display: flex;
      flex-wrap: wrap;

      .user-name {
        flex: 67%;
      }

      .user-phone {
        flex: 33%;
      }

      .user-getTime {
        margin-top: 14px;
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
      height: 43px;
      line-height: 43px;
      background: #fffbf0;
      border: 1px solid #fbe396;
      border-radius: 4px;
      margin-top: 10px;
      padding: 6px;
      display: flex;
      align-items: center;

      div {
        display: inline-block;
        min-width: 53px;
        height: 32px;
        background: #fbe396;
        border-radius: 4px;
        text-align: center;
        line-height: 32px;
        color: #333;
        margin-right: 30px;
        // padding: 12px 6px;
      }

      span {
        color: #f2a402;
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

        .dish-num {
          margin-right: 51px;
        }
      }

      // .dish-item:nth-child(odd) {
      //   flex: 60%;
      // }
      // .dish-item:nth-child(even) {
      //   flex: 40%;
      // }
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
</style>
<style lang="less">
.dashboard-container {
  .cancelTime {
    padding-left: 30px;
  }

  .orderTime {
    padding-left: 30px;
  }

  // td.operate .cell {

  //   .before,
  //   .middle,
  //   .after {
  //     height: 39px;
  //     width: 48px;
  //   }
  // }

  td.operate .cell,
  td.otherOperate .cell {
    display: flex;
    flex-wrap: nowrap;
    justify-content: center;
  }
}
</style>
