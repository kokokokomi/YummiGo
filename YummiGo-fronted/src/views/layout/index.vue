<script setup lang="ts" name="layout">
import { RouterView, useRouter, useRoute } from 'vue-router'
import { ElMessageBox, ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'
import { ref, reactive, onMounted, onBeforeUnmount, watch } from 'vue'
import { fixPwdAPI } from '@/api/employee'
import { getStatusAPI, fixStatusAPI } from '@/api/shop'
import { ElNotification } from 'element-plus'

// ------ data ------
const dialogFormVisible = ref(false)
const dialogStatusVisible = ref(false)
const formLabelWidth = '80px'
const isCollapse = ref(false)

const menuList = [
  {
    title: 'ダッシュボード',
    path: '/dashboard',
    icon: 'pieChart',
  },
  {
    title: 'データ統計',
    path: '/statistics',
    icon: 'memo',
  },
  {
    title: '注文管理',
    path: '/order',
    icon: 'collection',
  },
  {
    title: 'カテゴリ管理',
    path: '/category',
    icon: 'postcard',
  },
  {
    title: 'セットメニュー管理',
    path: '/setmeal',
    icon: 'user',
  },
  {
    title: '料理管理',
    path: '/dish',
    icon: 'dish',
  },
  {
    title: 'スタッフ管理',
    path: '/employee',
    icon: 'setting',
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

// refs
const websocket = ref<WebSocket | null>(null)
const shopShow = ref(false)

const audio1 = ref<HTMLAudioElement | null>(null)
const audio2 = ref<HTMLAudioElement | null>(null)

  //window.location.host自动获取当前网站的域名ip
const webSocket = () => {
  const clientId = Math.random().toString(36).slice(2)
  // 開発時は Vite が /ws を Spring(8080) にプロキシ。本番は同一オリジンまたは Nginx で /ws をバックエンドへ
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  const socketUrl = `${protocol}//${window.location.host}/ws/${clientId}`
  console.log('socketUrl', socketUrl)

  if (typeof WebSocket == 'undefined') {
    console.log('このブラウザではリアルタイム通知を利用できません。Chrome をご利用ください。')
    ElNotification({
      title: 'お知らせ',
      message: 'このブラウザではリアルタイム通知を利用できません。Chrome をご利用ください。',
      type: 'warning',
      duration: 0,
    })
  } else {
    websocket.value = new WebSocket(socketUrl)
    websocket.value.onopen = () => {
      console.log('浏览器WebSocket已打开')
    }
    websocket.value.onmessage = (msg) => {
      console.log('接收到的消息', msg)
      audio1.value && audio1.value.click()
      // 重置音频，从头开始播放
      audio1.value!.currentTime = 0
      audio2.value!.currentTime = 0
      // 解析服务器通过WebSocket发送的消息
      const jsonMsg = JSON.parse(msg.data)
      // event === stripe_payment_success は Stripe Webhook 落库后推送；その他 type 1/2 は従来ロジック
      if (jsonMsg.type === 1) {
        audio1.value!.play()
      } else if (jsonMsg.type === 2) {
        audio2.value!.play()
      }
      const payDone = jsonMsg.event === 'stripe_payment_success'
      const title =
        payDone ? '支払い完了' : jsonMsg.type === 1 ? '受付待ち' : '催促'
      const htmlMessage =
        jsonMsg.type === 1
          ? `<span>${payDone ? '<b>Stripe 決済済み</b> ' : ''}<span style="color:#419EFF">注文対応が必要です</span>、${jsonMsg.content}、すぐに注文を確認してください</span>`
          : `${jsonMsg.content}<span style='color:#419EFF;cursor: pointer'>処理する</span>`
      // 右上角弹窗提示
      ElNotification({
        title,
        message: htmlMessage,
        duration: 0,
        dangerouslyUseHTMLString: true,
        onClick: () => {
          router.push(`/order?orderId=${jsonMsg.orderId}`).catch((err) => {
            console.log(err)
          })
          setTimeout(() => {
            location.reload()
          }, 100)
        },
      })
    }
    websocket.value.onerror = () => {
      ElNotification({
        title: 'エラー',
        message: 'サーバーエラーによりリアルタイム通知を受信できません',
        type: 'error',
        duration: 0,
      })
    }
    websocket.value.onclose = () => {
      console.log('WebSocket已关闭')
    }
  }
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
onMounted(() => {
  document.addEventListener('click', handleClose)
  fetchShopStatus()
  webSocket()
})

onBeforeUnmount(() => {
  if (websocket.value) {
    websocket.value.close()
  }
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
        <div class="status">{{ status == 1 ? '営業中' : "閉店中" }}</div>

        <div class="rightAudio">
          <audio ref="audio1" hidden>
            <source src="../../assets/preview.mp3" type="audio/mp3" />
          </audio>
          <audio ref="audio2" hidden>
            <source src="../../assets/reminder.mp3" type="audio/mp3" />
          </audio>
        </div>
        <el-dropdown style="float: right">
          <el-button type="primary">
            {{ userInfoStore.userInfo ? userInfoStore.userInfo.userName : '未ログイン' }}
            <el-icon class="arrow-down-icon"><arrow-down /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="dialogFormVisible = true">パスワード変更</el-dropdown-item>
              <el-dropdown-item @click="quitFn">ログアウト</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
        <el-button class="status-change" @click="dialogStatusVisible = true">店舗状態の設定</el-button>
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
          <el-footer>© 2025.8.28 YummiGo Tech and Fun. All rights reserved.</el-footer>
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
    align-items: center;
    vertical-align: top;
    line-height: 30px;
    margin: 15px 50px;
    padding: 0 10px;
    border-radius: 5px;
    background-color: #eebb00;
    color: #fff;
  }
}

.rightAudio {
  float: right;
  // margin: 14px 20px;
}

.status-change {
  float: right;
  margin: 14px 20px;
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  color: #fff;
}

.user {
  float: right;
  margin-right: 20px;
}

.el-dropdown .el-button {
  float: right;
  width: 80px;
  margin: 14px 20px;
  background-color: #eebb00;
  border-color: #eebb00;
  color: #fff;

  .arrow-down-icon {
    margin-left: 5px;
  }
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
</style>