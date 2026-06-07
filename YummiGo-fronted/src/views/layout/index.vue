<script setup lang="ts" name="layout">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { fixPwdAPI } from '@/api/employee'
import { getStatusAPI, fixStatusAPI } from '@/api/shop'
import { ElNotification } from 'element-plus'
import { createMerchantWebSocket, type OrderWsPayload } from '@/utils/merchantWebSocket'
import { useOrderNotifyStore } from '@/store/orderNotify'

// ------ data ------
const dialogFormVisible = ref(false)
const dialogStatusVisible = ref(false)
const formLabelWidth = '80px'
const isCollapse = ref(false)

const menuList = [
  {
    title: 'ダッシュボード',
    path: '/dashboard',
    icon: 'PieChart',
  },
  {
    title: 'データ統計',
    path: '/statistics',
    icon: 'Memo',
  },
  {
    title: '注文管理',
    path: '/order',
    icon: 'Collection',
  },
  {
    title: 'カテゴリ管理',
    path: '/category',
    icon: 'Postcard',
  },
  {
    title: 'セットメニュー管理',
    path: '/setmeal',
    icon: 'User',
  },
  {
    title: '料理管理',
    path: '/dish',
    icon: 'Dish',
  },
  {
    title: 'スタッフ管理',
    path: '/employee',
    icon: 'Setting',
  },
]

const form = reactive({
  oldPwd: '',
  newPwd: '',
  rePwd: '',
})
const pwdRef = ref()
const status = ref(0)
const status_active = ref(0) // 单选框绑定的动态值

// 自定义校验规则: 两次密码是否一致
const samePwd = (rules: any, value: any, callback: any) => {
  if (value !== form.newPwd) {
    // 如果验证失败，则调用 回调函数时，指定一个 Error 对象。
    callback(new Error('新しいパスワードが一致しません'))
  } else {
    // 如果验证成功，则直接调用 callback 回调函数即可。
    callback()
  }
}
const rules = { // 表单的规则检验对象
  oldPwd: [
    { required: true, message: '現在のパスワードを入力してください', trigger: 'blur' },
    {
      pattern: /^[a-zA-Z0-9]{1,10}$/,
      message: '現在のパスワードは半角英数字1〜10文字',
      trigger: 'blur'
    }
  ],
  newPwd: [
    { required: true, message: '新しいパスワードを入力してください', trigger: 'blur' },
    { pattern: /^\S{6,15}$/, message: '新しいパスワードは6〜15文字（空白以外）', trigger: 'blur' }
  ],
  rePwd: [
    { required: true, message: '新しいパスワードを再度入力してください', trigger: 'blur' },
    { pattern: /^\S{6,15}$/, message: '新しいパスワードは6〜15文字（空白以外）', trigger: 'blur' },
    { validator: samePwd, trigger: 'blur' }
  ]
}

// ------ method ------
const router = useRouter()
const userInfoStore = useUserInfoStore()
const route = useRoute();
// 根据当前路由的路径返回要激活的菜单项
const getActiveAside = () => {
  console.log('当前路由的路径--------------', route.path)
  return route.path;
};

// 初始化时获取营业状态
// const init = async () => {
//   const { data: res } = await getStatusAPI()
//   console.log('初始化后的status status_active', res.data)
//   status.value = res.data
//   status_active.value = res.data
// }
// init()

// 关闭修改店铺状态对话框
const cancelStatus = () => {
  ElMessage({
    type: 'info',
    message: '変更をキャンセルしました',
  })
  dialogStatusVisible.value = false
}
// 关闭修改密码对话框
const cancelForm = () => {
  ElMessage({
    type: 'info',
    message: '変更をキャンセルしました',
  })
  dialogFormVisible.value = false
}
watch(status, (newVal, oldVal) => {
  console.log('status 变化:', oldVal, '->', newVal)
})

// 修改店铺状态
const fixStatus = async () => {
  try {
    // console.log('准备修改状态为:', status_active.value)
    
    await fixStatusAPI(status_active.value)
    
    // 更新本地状态
    status.value = status_active.value
    // console.log('状态已更新为:', status.value)
    
    //关闭弹窗并提示
    dialogStatusVisible.value = false
    ElMessage.success('変更しました')
    
  } catch (error) {
    console.error('修改状态出错:', error)
    ElMessage.error('変更に失敗しました。再試行してください')
  }
}

// 修改密码
const fixPwd = async () => {
  const valid = await pwdRef.value.validate()
  if (valid) {
    const submitForm = {
      oldPwd: form.oldPwd,
      newPwd: form.newPwd,
    }
    console.log('要提交的表单信息')
    console.log(submitForm)
    const { data: res } = await fixPwdAPI(submitForm)
    if (res.code != 0) return   // 密码错误信息会在相应拦截器中捕获并提示
    ElMessage({
      type: 'success',
      message: 'パスワードを変更しました',
    })
    dialogFormVisible.value = false
  } else {
    return false
  }
}

const quitFn = () => {
  // 为了让用户体验更好，来个确认提示框
  ElMessageBox.confirm(
    'ログアウトしますか？',
    'ログアウト',
    {
      confirmButtonText: 'はい',
      cancelButtonText: 'いいえ',
      type: 'warning',
    }
  )
    .then(() => {
      ElMessage({
        type: 'success',
        message: 'ログアウトしました',
      })
      // 清除用户信息，包括token
      userInfoStore.userInfo = null
      console.log(userInfoStore)
      router.push('/login')
    })
    .catch(() => {
      ElMessage({
        type: 'info',
        message: 'ログアウトをキャンセルしました',
      })
    })
}

const shopShow = ref(false)
const wsErrorNotified = ref(false)
let closeWebSocket: (() => void) | null = null

const audio1 = ref<HTMLAudioElement | null>(null)
const audio2 = ref<HTMLAudioElement | null>(null)
const audioUnlocked = ref(false)

const unlockAudio = async () => {
  if (audioUnlocked.value) return
  const players = [audio1.value, audio2.value].filter(Boolean) as HTMLAudioElement[]
  for (const player of players) {
    try {
      player.muted = true
      await player.play()
      player.pause()
      player.currentTime = 0
      player.muted = false
    } catch {
      // 浏览器策略限制时忽略，后续通知仍显示弹窗
    }
  }
  audioUnlocked.value = true
}

const playOrderSound = (type?: number) => {
  const player = type === 2 ? audio2.value : audio1.value
  if (!player) return
  try {
    player.currentTime = 0
    const result = player.play()
    if (result && typeof result.catch === 'function') {
      result.catch(() => {
        // macOS / 浏览器更新后常需用户先与页面交互才能播放
      })
    }
  } catch {
    // 音效失败不影响弹窗
  }
}

const orderNotifyStore = useOrderNotifyStore()

const showOrderNotification = (jsonMsg: OrderWsPayload) => {
  const payDone = jsonMsg.event === 'stripe_payment_success'
  const title = payDone ? '支払い完了' : jsonMsg.type === 1 ? '受付待ち' : '催促'
  const htmlMessage =
    jsonMsg.type === 1
      ? `<span>${payDone ? '<b>Stripe 決済済み</b> ' : ''}<span style="color:#419EFF">注文対応が必要です</span>、${jsonMsg.content || ''}、すぐに注文を確認してください</span>`
      : `${jsonMsg.content || ''}<span style='color:#419EFF;cursor: pointer'>処理する</span>`

  ElNotification({
    title,
    message: htmlMessage,
    type: jsonMsg.type === 2 ? 'warning' : 'success',
    position: 'top-right',
    duration: 0,
    showClose: true,
    zIndex: 3000,
    dangerouslyUseHTMLString: true,
    onClick: () => {
      const orderId = jsonMsg.orderId ? String(jsonMsg.orderId) : ''
      if (!orderId) return
      router.push({ path: '/order', query: { orderId, status: '2' } })
    },
  })
}

const webSocket = () => {
  if (typeof WebSocket === 'undefined') {
    ElNotification({
      title: 'お知らせ',
      message: 'このブラウザではリアルタイム通知を利用できません。Chrome をご利用ください。',
      type: 'warning',
      duration: 0,
    })
    return
  }

  closeWebSocket = createMerchantWebSocket({
    onConnect: () => {
      wsErrorNotified.value = false
    },
    onDisconnect: () => {},
    onError: () => {
      if (wsErrorNotified.value) return
      wsErrorNotified.value = true
      ElNotification({
        title: '接続エラー',
        message: 'リアルタイム通知の接続に失敗しました。自動で再接続を試みます。',
        type: 'warning',
        duration: 5000,
      })
    },
    onMessage: (jsonMsg) => {
      console.log('接收到的消息', jsonMsg)
      orderNotifyStore.notify(jsonMsg)
      playOrderSound(jsonMsg.type)
      showOrderNotification(jsonMsg)
    },
  })
}

const handleClose = () => {
  shopShow.value = false
}


const fetchShopStatus = async () => {
  console.log('fetchShopStatus 开始')
  const { data: res } = await getStatusAPI()
  console.log('后端返回的 res.data:', res.data)
  status.value = res.data
  status_active.value = res.data
  console.log('fetchShopStatus 更新后:', status.value)
}

// lifecycle hooks
const handleDocumentClick = () => {
  handleClose()
  void unlockAudio()
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  fetchShopStatus()
  webSocket()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  closeWebSocket?.()
  closeWebSocket = null
})
</script>

<template>
  <div class="common-layout">
    <el-dialog v-model="dialogStatusVisible" title="店舗状態の設定" width="500">
      <el-radio-group v-model="status_active">
        <el-radio :value="1" size="large">営業中
          <span>現在レストランは営業中です。自動的に全ての注文を受付します。「閉店中」ボタンを押すと営業を終了します。</span>
        </el-radio>
        <el-radio :value="0" size="large">閉店中
          <span>現在レストランは閉店中です。営業時間内の予約注文のみ受付ます。「営業中」ボタンで手動で営業を再開できます。</span>
        </el-radio>
      </el-radio-group>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelStatus">キャンセル</el-button>
          <el-button type="primary" @click="fixStatus">確認</el-button>
        </div>
      </template>
    </el-dialog>
    <el-dialog v-model="dialogFormVisible" title="パスワード変更" width="500">
      <el-form :model="form" :rules="rules" ref="pwdRef">
        <el-form-item prop="oldPwd" label="現在のパスワード" :label-width="formLabelWidth">
          <el-input v-model="form.oldPwd" autocomplete="off" />
        </el-form-item>
        <el-form-item prop="newPwd" label="新しいパスワード" :label-width="formLabelWidth">
          <el-input v-model="form.newPwd" autocomplete="off" />
        </el-form-item>
        <el-form-item prop="rePwd" label="パスワード確認" :label-width="formLabelWidth">
          <el-input v-model="form.rePwd" autocomplete="off" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="cancelForm">キャンセル</el-button>
          <el-button type="primary" @click="fixPwd">確認</el-button>
        </div>
      </template>
    </el-dialog>
    <el-container>
      <el-header>
        <img src="../../assets/image/Yummigo_logo.png" class="logo" />
        <el-icon class="icon1" v-if="isCollapse">
          <Expand @click.stop="isCollapse = !isCollapse" />
        </el-icon>
        <el-icon class="icon1" v-else>
          <Fold @click.stop="isCollapse = !isCollapse" />
        </el-icon>
        <div class="status" :class="status == 1 ? 'status-open' : 'status-closed'">
          {{ status == 1 ? '営業中' : '閉店中' }}
        </div>

        <div class="header-right">
          <div class="rightAudio">
            <audio ref="audio1" hidden>
              <source src="../../assets/preview.mp3" type="audio/mp3" />
            </audio>
            <audio ref="audio2" hidden>
              <source src="../../assets/reminder.mp3" type="audio/mp3" />
            </audio>
          </div>
          <el-button class="status-change" @click="dialogStatusVisible = true">店舗状態</el-button>
          <el-dropdown trigger="click" popper-class="user-dropdown-popper">
            <div class="user-trigger">
              <div class="user-avatar">
                {{ (userInfoStore.userInfo?.userName || 'U').slice(0, 1).toUpperCase() }}
              </div>
              <div class="user-meta">
                <span class="user-name">{{ userInfoStore.userInfo?.userName || '未ログイン' }}</span>
                <span class="user-role">管理者</span>
              </div>
              <el-icon class="user-chevron"><arrow-down /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="dialogFormVisible = true">
                  <el-icon><Lock /></el-icon>
                  パスワード変更
                </el-dropdown-item>
                <el-dropdown-item divided @click="quitFn">
                  <el-icon><SwitchButton /></el-icon>
                  ログアウト
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-container class="box1">
        <!-- 左侧导航菜单区域 -->
        <el-menu :width="isCollapse ? '640px' : '200px'" :default-active="getActiveAside()" :collapse="isCollapse"
          background-color="#22aaee" text-color="#fff" unique-opened router>
          <!-- 加了router模式，就会在激活导航时以 :index 作为path进行路径跳转（不用自己写路由了!） -->
          <!-- 根据不同情况选择menu-item/submenu进行遍历，所以外层套template遍历，里面组件做判断看是否该次遍历到自己 -->
          <template v-for="item in menuList" :key="item.path">
            <el-menu-item :index="item.path">
              <el-icon>
                <component :is="item.icon" />
              </el-icon>
              <span>{{ item.title }}</span>
            </el-menu-item>
          </template>
        </el-menu>

        <el-container class="mycontainer">
          <el-main>
            <router-view></router-view>
          </el-main>
          <el-footer>© 2025.8.28 YummiGo kokomiorz@gmail. All rights reserved.</el-footer>
        </el-container>
      </el-container>
    </el-container>
  </div>
</template>

<style lang="less" scoped>
.common-layout {
  height: 100%;
  background-color: #eee;
}

.el-header {
  background-color: #00aaff;
  color: #ffffff;
  line-height: 60px;

  .logo {
    display: inline-block;
    margin: 10px 20px;
    width: 180px;
    height: 40px;
  }

  .icon1 {
    position: absolute;
    top: 18px;
    margin: 5px 10px 0 0;
  }

  .status {
    display: inline-block;
    vertical-align: top;
    line-height: 28px;
    margin: 16px 24px;
    padding: 0 12px;
    border-radius: 999px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.02em;
  }

  .status-open {
    background-color: #16a34a;
    color: #fff;
    box-shadow: 0 2px 8px rgba(22, 163, 74, 0.35);
  }

  .status-closed {
    background-color: #dc2626;
    color: #fff;
    box-shadow: 0 2px 8px rgba(220, 38, 38, 0.35);
  }

  .header-right {
    float: right;
    display: flex;
    align-items: center;
    gap: 10px;
    height: 60px;
    padding-right: 12px;
  }
}

.rightAudio {
  width: 0;
  height: 0;
  overflow: hidden;
}

.status-change {
  background-color: rgba(255, 255, 255, 0.22);
  border: 1px solid rgba(255, 255, 255, 0.35);
  color: #fff;
  border-radius: 999px;
  padding: 8px 14px;
  height: auto;
}

.user-trigger {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 10px 6px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.18);
  border: 1px solid rgba(255, 255, 255, 0.28);
  cursor: pointer;
  transition: background 0.2s ease;
}

.user-trigger:hover {
  background: rgba(255, 255, 255, 0.28);
}

.user-avatar {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  background: linear-gradient(135deg, #fbbf24, #f59e0b);
  color: #1f2937;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
}

.user-meta {
  display: flex;
  flex-direction: column;
  line-height: 1.2;
  min-width: 72px;
}

.user-name {
  color: #fff;
  font-size: 13px;
  font-weight: 700;
}

.user-role {
  color: rgba(255, 255, 255, 0.78);
  font-size: 11px;
}

.user-chevron {
  color: rgba(255, 255, 255, 0.9);
  font-size: 14px;
}

.box1 {
  display: flex;
  height: 92vh;
}

.mycontainer {
  display: flex;
  flex: 6;
  flex-direction: column;
}

.el-main {
  flex: 1;
  background-color: #e9f5ff;
  color: #333;
  /* text-align: center; */
  /* line-height: 80px; */
}

a {
  display: block;
  height: 4rem;
  color: #334455;
  font-size: 20px;
  font-weight: bold;
  text-decoration: none;
}

a:hover {
  background-color: #445566;
  color: #eee;
}

.el-footer {
  background-color: #eee;
  font-size: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
}
</style>



<style lang="less">
.el-dialog {
  border-radius: 2%;
}

.el-dialog__header {
  height: 60px;
  line-height: 60px;
  padding: 0 30px;
  font-weight: bold;
}

.el-dialog__body {
  padding: 10px 30px 30px;

  .el-radio,
  .el-radio__input {
    white-space: normal; // 设置其自动换行，别撑不下还挤在一起...
  }

  .el-radio__label {
    padding-top: 15px;
    color: #445588;
    font-weight: 700;

    span {
      display: block;
      line-height: 20px;
      padding: 12px 0 20px 0;
      color: #666;
      font-weight: normal;
    }
  }

  .el-radio-group {
    &>.is-checked {
      border: 1px solid #00aaff;
    }
  }

  .el-radio {
    width: 410px; // 设置成固定值能去除el-radio-last-child的样式影响
    height: 100px;
    background: #fbfbfa;
    border: 1px solid #e5e4e4;
    border-radius: 4px;
    padding: 14px 22px;
    margin-top: 20px;
  }

  // .el-radio__input.is-checked+.el-radio__label {
  //   span {}
  // }
}

.el-badge__content.is-fixed {
  top: 24px;
  right: 2px;
  width: 18px;
  height: 18px;
  font-size: 10px;
  line-height: 16px;
  font-size: 10px;
  border-radius: 50%;
  padding: 0;
}

.badgeW {
  .el-badge__content.is-fixed {
    width: 30px;
    border-radius: 20px;
  }
}

.el-menu {
  padding: 30px 0 0 0;
  background-color: #445566;
}

.el-menu-item {
  margin: 10px;
  padding-right: 30px;
  border-radius: 10px;
}

.el-menu-item.is-active {
  background-color: #22ccff;
  color: #fff;
}

.el-menu--collapse {
  width: 85px;
}

.user-dropdown-popper .el-dropdown-menu__item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 168px;
  font-weight: 600;
}
</style>