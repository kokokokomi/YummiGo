import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import IconPlugin from './plugins/icons'
import LazyDirective from './directives/lazy'
// 命令式 API（ElNotification / ElMessage 等）需要单独引入样式，否则只有声音、看不到弹窗
import 'element-plus/es/components/notification/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'

const app = createApp(App)
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

// Element Plus 组件 (<el-button> 等) 与样式由 unplugin-vue-components 自动按需引入
// 仅注册项目中实际使用到的图标，避免全量打包
app.use(IconPlugin)
// 图片懒加载指令 v-lazy，基于 IntersectionObserver
app.use(LazyDirective)
app.use(router)
app.use(pinia)

app.mount('#app')
