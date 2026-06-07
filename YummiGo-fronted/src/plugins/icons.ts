import type { App } from 'vue'
import {
  // 通用操作类
  Plus,
  Search,
  ArrowDown,
  ArrowRight,
  Expand,
  Fold,
  // dashboard 卡片用
  Finished,
  Lock,
  CirclePlus,
  DocumentAdd,
  Bicycle,
  DocumentChecked,
  DocumentDelete,
  Document,
  // 左侧菜单用（layout 里通过 :is="iconName" 动态渲染）
  PieChart,
  Memo,
  Collection,
  Postcard,
  User,
  Dish,
  Setting,
  SwitchButton,
} from '@element-plus/icons-vue'

const icons = {
  Plus,
  Search,
  ArrowDown,
  ArrowRight,
  Expand,
  Fold,
  Finished,
  Lock,
  CirclePlus,
  DocumentAdd,
  Bicycle,
  DocumentChecked,
  DocumentDelete,
  Document,
  PieChart,
  Memo,
  Collection,
  Postcard,
  User,
  Dish,
  Setting,
  SwitchButton,
}

export default {
  install(app: App) {
    Object.entries(icons).forEach(([name, comp]) => {
      app.component(name, comp)
    })
  },
}
