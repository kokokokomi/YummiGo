<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import AddDish from './components/AddDish.vue'
import { addSetmealAPI, getSetmealByIdAPI, updateSetmealAPI } from '@/api/setmeal'
import { getCategoryPageListAPI } from '@/api/category'
import { uploadImageAPI } from '@/api/common'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { resolveImageUrl as resolveImageUrlByRule } from '@/utils/image'

// ------ 配置 ------
const dialogVisible = ref(false)  // 添加菜品弹窗是否显示
const formLabelWidth = '70px'    // 表单label宽度
// const actionType = ref('add')  // 当前操作类型，add为新增，update为修改更新
// 直接看有没有query.id就行，有的话就是update，没有就是add

// ------ 数据 ------

interface Category {
  id: number
  name: string
}
interface SetmealDish {
  dishId: number
  name: string
  price: number
  copies: number
  status?: number | string
}
// 套餐分类(type=2)列表
const categoryList = ref<Category[]>([])
// 套餐当前选择的菜品，用于表格展示（退出dialog时的暂存状态）
const dishTable = ref<SetmealDish[]>([])
// 套餐当前选择的菜品，用于提交（在dialog中时的动态状态）
let selectList: SetmealDish[] = []
const inputValue = ref('')  // input框的实时动态变化值
const searchKey = ref('')  // 搜索关键字

const form = reactive({
  id: 0,
  name: '',
  pic: '',
  setmealDishes: [] as SetmealDish[],
  detail: '',
  price: 0,
  status: '',
  categoryId: ''
})
const isPriceManuallyEdited = ref(false)
// 图片下的隐藏input框
const inputRef1 = ref<HTMLInputElement | null>(null)
const addRef = ref()
const cropDialogVisible = ref(false)
const selectedImageData = ref('')
const croppedPreview = ref('')
const crop = reactive({
  x: 0,
  y: 0,
  size: 0,
  naturalWidth: 0,
  naturalHeight: 0,
})
const cropImageRef = ref<HTMLImageElement | null>(null)
const dragging = reactive({
  active: false,
  startClientX: 0,
  startClientY: 0,
  startCropX: 0,
  startCropY: 0,
})
const outputMaxBytes = 900 * 1024 // Keep payload small to avoid 413
const maxCropSize = computed(() => Math.min(crop.naturalWidth, crop.naturalHeight))
const minCropSize = computed(() => Math.min(80, maxCropSize.value || 80))
const maxX = computed(() => Math.max(crop.naturalWidth - crop.size, 0))
const maxY = computed(() => Math.max(crop.naturalHeight - crop.size, 0))
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const toAmount = (value: unknown) => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}
const selectedDishTotal = computed(() => {
  return dishTable.value.reduce((sum, item) => {
    return sum + toAmount(item.price) * toAmount(item.copies || 1)
  }, 0)
})
const normalizeSetmealDishes = (raw: any): SetmealDish[] => {
  const source = raw?.setmealDishes || raw?.setmealDishes || raw?.setmealDishList || raw?.dishList || raw?.dishes || []
  if (!Array.isArray(source)) return []
  return source
    .map((item: any) => ({
      dishId: Number(item?.dishId ?? item?.id ?? 0),
      name: String(item?.name ?? ''),
      price: toAmount(item?.price),
      copies: Math.max(1, toAmount(item?.copies || 1)),
      status: item?.status,
    }))
    .filter((item: SetmealDish) => item.dishId > 0 || item.name)
}
const resolveImageUrl = resolveImageUrlByRule

const normalizeCropValue = () => {
  const safeNaturalWidth = Number.isFinite(crop.naturalWidth) ? crop.naturalWidth : 0
  const safeNaturalHeight = Number.isFinite(crop.naturalHeight) ? crop.naturalHeight : 0
  const safeMaxCropSize = Math.max(Math.min(safeNaturalWidth, safeNaturalHeight), 0)
  const safeMinCropSize = Math.min(80, safeMaxCropSize || 80)
  if (safeMaxCropSize <= 0) {
    crop.size = 0
    crop.x = 0
    crop.y = 0
    return
  }
  const safeSize = Number.isFinite(crop.size) ? crop.size : safeMinCropSize
  crop.size = clamp(safeSize, safeMinCropSize, safeMaxCropSize)
  const safeMaxX = Math.max(safeNaturalWidth - crop.size, 0)
  const safeMaxY = Math.max(safeNaturalHeight - crop.size, 0)
  const safeX = Number.isFinite(crop.x) ? crop.x : 0
  const safeY = Number.isFinite(crop.y) ? crop.y : 0
  crop.x = clamp(safeX, 0, safeMaxX)
  crop.y = clamp(safeY, 0, safeMaxY)
}

const cropBoxStyle = computed(() => {
  if (!cropImageRef.value || crop.naturalWidth <= 0 || crop.naturalHeight <= 0 || crop.size <= 0) {
    return {}
  }
  const imageWidth = cropImageRef.value.clientWidth || 0
  const imageHeight = cropImageRef.value.clientHeight || 0
  if (imageWidth <= 0 || imageHeight <= 0) {
    return {}
  }
  const widthRatio = imageWidth / crop.naturalWidth
  const heightRatio = imageHeight / crop.naturalHeight
  return {
    width: `${Math.max(crop.size * widthRatio, 0)}px`,
    height: `${Math.max(crop.size * heightRatio, 0)}px`,
    transform: `translate(${Math.max(crop.x * widthRatio, 0)}px, ${Math.max(crop.y * heightRatio, 0)}px)`,
  }
})

// 表单校验
const rules = {
  name: [
    { required: true, trigger: 'blur', message: '必須項目です' },
  ],
  setmealDishes: [
    { required: true, trigger: 'blur', message: '必須項目です' },
  ],
  detail: [
    { required: true, trigger: 'blur', message: '必須項目です' },
  ],
  price: [
    { required: true, trigger: 'blur', message: '必須項目です' },
  ],
  categoryId: [
    { required: true, trigger: 'blur', message: '必須項目です' },
  ],
}


// ------ 方法 ------

const router = useRouter()
const route = useRoute()

const init = async () => {
  // 1. 获取套餐分类，等下套餐选择分类时有个下拉框，要展示所有套餐的分类
  // 由于复用分页查询的API，这里不需要分页且数据量较少，所以pageSize设置为100
  const { data: res } = await getCategoryPageListAPI({ page: 1, pageSize: 100, type: 2 })
  console.log('分类列表')
  console.log(res.data)
  categoryList.value = res.data.records
  console.log('categoryList: ', categoryList.value)
  // 2. 由于当前页面可能是add也可能是update，所以要根据路由参数来判断是否需要dishTable等数据的初始化
  if (route.query.id !== undefined) {
    console.log('来到修改套餐页面update, 套餐id为', route.query.id as string)
    form.id = route.query.id ? parseInt(route.query.id as string) : 0
    const setmeal = await getSetmealByIdAPI(form.id)
    console.log(setmeal)
    const data = setmeal.data.data || {}
    form.name = data.name || ''
    form.pic = data.image || data.pic || ''
    form.detail = data.description || data.detail || ''
    form.price = toAmount(data.price)
    form.status = data.status ?? ''
    form.categoryId = data.categoryId ?? ''
    form.setmealDishes = normalizeSetmealDishes(data)
    dishTable.value = [...form.setmealDishes]
    selectList = [...form.setmealDishes]
    if (form.price <= 0 && dishTable.value.length > 0) {
      form.price = Number(selectedDishTotal.value.toFixed(2))
    }
    console.log(form)
  } else {
    console.log('来到新增套餐页面add')
  }
}

init()


// 选择图片->点击事件->让选择框出现
const chooseImg = () => {
  // 模拟点击input框的行为，通过点击按钮触发另一个input框的事件，移花接木
  // 否则直接调用input框，其样式不太好改    input框中有个inputRef1属性，让inputRef1去click模拟点击行为
  if (inputRef1.value) {
    inputRef1.value.click() // 当input框的type是file时，click()方法会触发选择文件的对话框(弹出文件管理器)
  }
}

const fileToDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
  })

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = reject
    image.src = src
  })

const getBase64Size = (base64: string) => {
  const content = base64.split(',')[1] || ''
  return Math.ceil((content.length * 3) / 4)
}

const dataUrlToFile = async (dataUrl: string, filename: string) => {
  const response = await fetch(dataUrl)
  const blob = await response.blob()
  return new File([blob], filename, { type: blob.type || 'image/jpeg' })
}

const createCroppedBase64 = async () => {
  if (!selectedImageData.value || crop.size <= 0) {
    return ''
  }
  const image = await loadImage(selectedImageData.value)
  let renderSize = crop.size
  let quality = 0.9
  const minRenderSize = 320
  const canvas = document.createElement('canvas')
  let result = ''
  while (true) {
    canvas.width = Math.floor(renderSize)
    canvas.height = Math.floor(renderSize)
    const context = canvas.getContext('2d')
    if (!context) {
      break
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(
      image,
      crop.x,
      crop.y,
      crop.size,
      crop.size,
      0,
      0,
      canvas.width,
      canvas.height,
    )
    result = canvas.toDataURL('image/jpeg', quality)
    if (getBase64Size(result) <= outputMaxBytes || (quality <= 0.5 && renderSize <= minRenderSize)) {
      break
    }
    if (quality > 0.5) {
      quality -= 0.1
    } else {
      renderSize = Math.max(Math.floor(renderSize * 0.8), minRenderSize)
    }
  }
  return result
}

const updateCropPreview = async () => {
  croppedPreview.value = await createCroppedBase64()
}

const onCropParamChange = () => {
  if (!cropDialogVisible.value) {
    return
  }
  normalizeCropValue()
  updateCropPreview()
}

const onCropSizeChange = () => {
  normalizeCropValue()
  onCropParamChange()
}

const stopDrag = () => {
  dragging.active = false
  window.removeEventListener('pointermove', onDragMove)
  window.removeEventListener('pointerup', stopDrag)
}

const onDragMove = (event: PointerEvent) => {
  if (!dragging.active || !cropImageRef.value) {
    return
  }
  const imageWidth = cropImageRef.value.clientWidth || 0
  const imageHeight = cropImageRef.value.clientHeight || 0
  if (imageWidth <= 0 || imageHeight <= 0 || crop.naturalWidth <= 0 || crop.naturalHeight <= 0) {
    stopDrag()
    return
  }
  const deltaX = ((event.clientX - dragging.startClientX) / imageWidth) * crop.naturalWidth
  const deltaY = ((event.clientY - dragging.startClientY) / imageHeight) * crop.naturalHeight
  crop.x = dragging.startCropX + deltaX
  crop.y = dragging.startCropY + deltaY
  onCropParamChange()
}

const onCropDragStart = (event: PointerEvent) => {
  if (crop.size <= 0 || !cropImageRef.value) {
    return
  }
  dragging.active = true
  dragging.startClientX = event.clientX
  dragging.startClientY = event.clientY
  dragging.startCropX = crop.x
  dragging.startCropY = crop.y
  window.addEventListener('pointermove', onDragMove)
  window.addEventListener('pointerup', stopDrag)
}

const getFileExt = (name: string) => {
  const segments = name.split('.')
  return segments.length > 1 ? segments.pop()!.toLowerCase() : ''
}

const openCropDialog = async (file: File) => {
  const ext = getFileExt(file.name || '')
  const allowByExt = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'heic', 'heif']
  const isImage = file.type.startsWith('image/') || allowByExt.includes(ext)
  if (!isImage) {
    ElMessage.warning('画像ファイルを選択してください')
    return
  }
  if (['heic', 'heif'].includes(ext) || file.type === 'image/heic' || file.type === 'image/heif') {
    ElMessage.warning('HEIC/HEIF は現在のブラウザで裁剪に対応していません。PNG/JPG に変換してから再度お試しください。')
    return
  }
  try {
    selectedImageData.value = await fileToDataUrl(file)
    const image = await loadImage(selectedImageData.value)
    crop.naturalWidth = image.width
    crop.naturalHeight = image.height
    crop.size = Math.min(image.width, image.height)
    crop.x = Math.floor((image.width - crop.size) / 2)
    crop.y = Math.floor((image.height - crop.size) / 2)
    cropDialogVisible.value = true
    await updateCropPreview()
  } catch (error) {
    console.error('openCropDialog failed', error)
    ElMessage.error('画像の読み込みに失敗しました。別の画像で再試行してください。')
  }
}

// 在文件管理器中选择图片后触发的改变事件：预览 + 裁剪
const onFileChange1 = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    try {
      await openCropDialog(files[0])
    } catch (error) {
      console.error('onFileChange1 failed', error)
      ElMessage.error('画像処理に失敗しました')
    }
  }
  target.value = ''
}

const applyCrop = async () => {
  if (!croppedPreview.value) {
    ElMessage.warning('画像の裁剪に失敗しました')
    return
  }
  try {
    const file = await dataUrlToFile(croppedPreview.value, `setmeal-${Date.now()}.jpg`)
    const res = await uploadImageAPI(file)
    if (res.data.code !== 1) {
      ElMessage.warning(res.data.message || '画像アップロードに失敗しました')
      return
    }
    form.pic = res.data.data
  } catch (error) {
    ElMessage.warning('画像アップロードに失敗しました')
    return
  }
  cropDialogVisible.value = false
}

const cancelCrop = () => {
  stopDrag()
  cropDialogVisible.value = false
}

// 取消修改
const cancel = () => {
  router.push({
    path: '/setmeal',
  })
}

// 点击搜索按钮，才把当前搜索框的内容作为搜索关键字，否则value一直动态变化
// 如果不用searchKey，直接用value，那么每次输入框的值变化，都会触发搜索，无法暂存中间变量
const searchHandle = () => {
  searchKey.value = inputValue.value
}
// 删除套餐菜品
const delDishHandle = (index: any) => {
  dishTable.value.splice(index, 1)
  selectList = dishTable.value
  // selectList.splice(index, 1)
  if (!isPriceManuallyEdited.value) {
    form.price = Number(selectedDishTotal.value.toFixed(2))
  }
}

// 获取添加菜品数据 - 确定加菜倒序展示
const getSelectList = (value: any) => {
  console.log('拿到子组件emit过来的checkedList?', value)
  selectList = [...value]
}

// 打开添加菜品对话框，初始化时清空搜索框残留数据
const openAddDish = (st: string) => {
  console.log('打开添加菜品对话框，初始化时清空搜索框残留数据')
  console.log('打开的状态st ', st)
  console.log('动态的selectList ', selectList)
  console.log('动态的dishTable ', dishTable.value)
  searchKey.value = ''
  // 同时要将外面的dishTable回显到dialog中，即将dishTable赋值给selectList
  selectList = JSON.parse(JSON.stringify(dishTable.value))
  dialogVisible.value = true
}
// 取消添加菜品，退出对话框，selectList还是保留原来外面的dishTable数据
const handleClose = () => {
  dialogVisible.value = false
  // 利用序列化和反序列化，实现对象的深拷贝，而不是只传个引用而已
  selectList = JSON.parse(JSON.stringify(dishTable.value))
}
// 确认添加菜品，退出对话框，将选中的菜品列表selectList赋值给dishTable
const addTableList = () => {
  console.log('添加菜品之前，到底有没有selectList？', selectList)
  dishTable.value = JSON.parse(JSON.stringify(selectList))
  // 新增时默认 1 份；编辑时保留已有份数，避免“打开再确认”导致份数被重置
  dishTable.value.forEach((n: any) => {
    const currentCopies = toAmount(n.copies)
    n.copies = currentCopies > 0 ? currentCopies : 1
  })
  if (!isPriceManuallyEdited.value) {
    form.price = Number(selectedDishTotal.value.toFixed(2))
  }
  dialogVisible.value = false
  console.log('dishTable', dishTable.value)
}
const onPriceInput = () => {
  isPriceManuallyEdited.value = true
}
const resetPriceSuggestion = () => {
  isPriceManuallyEdited.value = false
  form.price = Number(selectedDishTotal.value.toFixed(2))
}

// 添加套餐信息后提交
const submit = async (keep: any) => {
  console.log('keep,为空就是新增', keep)
  console.log('add提交表单，需要先将dishTable赋值给form.setmealDishes')
  console.log('dishTable', dishTable.value)
  console.log('selectList', selectList)
  console.log('form', form)
  console.log('开始进行赋值')
  form.setmealDishes = dishTable.value.map((obj: any) => ({
    copies: obj.copies,
    dishId: obj.dishId,
    name: obj.name,
    price: obj.price
  }))
  console.log('赋值后的form.setmealDishes', form.setmealDishes)
  console.log('form', form)
  const valid = await addRef.value.validate()
  if (valid) {
    const payload = {
      ...form,
      image: form.pic,
      description: form.detail,
    }
    delete (payload as any).pic
    delete (payload as any).detail
    // 输入合法性校验成功后，需要进行逻辑校验
    // 1. 套餐下菜品不能为空
    if (form.setmealDishes.length === 0) {
      ElMessage({
        message: 'セットに含める料理を1件以上選択してください',
        type: 'warning',
      })
      return false
    }
    const hasDisabledDish = dishTable.value.some((item: any) => item.status !== undefined && item.status !== null && Number(item.status) !== 1)
    if (hasDisabledDish) {
      ElMessage({
        message: '販売停止中の料理はセットに追加できません',
        type: 'warning',
      })
      return false
    }
    console.log('submit')
    console.log(form)
    // --- 处理完毕，开始提交 ---
    // 情况1：无路径参数，form.id保持默认值0，新增套餐
    if (form.id === 0) {
      console.log('新增套餐')
      const res = await addSetmealAPI(payload)
      if (res.data.code !== 1) {
        console.log('新增套餐失败！')
        return false
      }
      // 然后进行 消息提示
      ElMessage({
        message: 'セットを追加しました',
        type: 'success',
      })
      // 根据keep的值，决定是 保存退出 还是 继续添加
      if (keep) {
        // 继续添加，清空表单
        form.id = 0
        form.name = ''
        form.pic = ''
        form.setmealDishes = []
        form.detail = ''
        form.price = 0
        form.status = ''
        form.categoryId = ''
        // 清空表格
        dishTable.value = []
      } else {
        // 保存退出
        router.push({
          path: '/setmeal',
        })
      }
    }
    // 情况2：有路径参数，修改套餐
    else {
      console.log('修改套餐')
      const res = await updateSetmealAPI(payload)
      if (res.data.code !== 1) {
        console.log('修改套餐失败！')
        return false
      }
      ElMessage({
        message: '更新しました',
        type: 'success',
      })
      router.push({
        path: '/setmeal',
      })
    }
  } else {
    console.log('form not valid!')
    return false
  }
}
</script>

<template>
  <h1>{{ route.query.id ? 'セットを編集' : 'セットを追加' }}</h1>
  <el-card>
    <el-dialog v-model="cropDialogVisible" width="700px" title="画像を裁剪" @closed="stopDrag">
      <div class="cropper-wrap">
        <div class="cropper-panel">
          <div class="crop-stage">
            <img ref="cropImageRef" class="origin-img" :src="selectedImageData" alt="origin" />
            <div class="crop-box" :style="cropBoxStyle" @pointerdown.prevent="onCropDragStart" />
          </div>
          <el-form class="crop-form" label-position="top">
            <el-form-item label="サイズ">
              <el-slider v-model="crop.size" :min="minCropSize" :max="maxCropSize" :step="1" @input="onCropSizeChange" />
            </el-form-item>
          </el-form>
        </div>
        <div class="cropper-preview">
          <p>プレビュー（圧縮後）</p>
          <img v-if="croppedPreview" :src="croppedPreview" alt="preview" />
        </div>
      </div>
      <template #footer>
        <el-button @click="cancelCrop">キャンセル</el-button>
        <el-button type="primary" @click="applyCrop">適用</el-button>
      </template>
    </el-dialog>

    <el-dialog v-if="dialogVisible" title="料理を選択" class="addDishList" v-model="dialogVisible" width="60%"
      :before-close="handleClose">
      <el-input v-model="inputValue" class="searchDish" placeholder="料理名で検索" style="width: 293px; height: 40px"
        size="small" clearable>
        <template #prefix>
          <el-icon class="el-icon-search" style="cursor: pointer" @click="searchHandle">
            <search />
          </el-icon>
        </template>
      </el-input>
      <AddDish v-if="dialogVisible" ref="adddish" :check-list="selectList" :search-key="searchKey"
        @selectList="getSelectList" />
      <template v-slot:footer>
        <span class="dialog-footer">
          <el-button @click="handleClose">キャンセル</el-button>
          <el-button type="primary" @click="addTableList">追加</el-button>
        </span>
      </template>
    </el-dialog>

    <el-form :model="form" :rules="rules" ref="addRef">
      <el-form-item label="名称" :label-width="formLabelWidth" prop="name">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="画像" :label-width="formLabelWidth" prop="pic">
        <img class="the_img" v-if="!form.pic" src="/src/assets/image/user_default.png" alt="" />
        <img class="the_img" v-else :src="resolveImageUrl(form.pic)" alt="" />
        <input type="file" accept="image/*" style="display: none" ref="inputRef1" @change="onFileChange1" />
        <el-button type="primary" @click="chooseImg">
          <el-icon style="font-size: 15px; margin-right: 10px;">
            <Plus />
          </el-icon>
          画像を選択
        </el-button>
      </el-form-item>
      <el-form-item label="含める料理:">
        <div class="addDish">
          <!-- 当前没选菜品，就只展示添加菜品按钮，否则在下方要多一个已选菜品的表格 -->
          <span v-if="dishTable.length == 0" class="addBut" @click="openAddDish('new')">
            + 料理を追加</span>
          <div v-if="dishTable.length != 0" class="content">
            <div class="addBut" style="margin-bottom: 20px" @click="openAddDish('change')">
              + 料理を追加
            </div>
            <div class="table">
              <el-table :data="dishTable" style="width: 100%">
                <el-table-column prop="name" label="名称" width="180" align="center" />
                <el-table-column prop="price" label="単価" width="180" align="center">
                  <template v-slot="scope">
                    {{ ((scope.row.price).toFixed(2) * 100) / 100 }}
                  </template>
                </el-table-column>
                <el-table-column prop="copies" label="数量" align="center">
                  <template v-slot="scope">
                    <el-input-number v-model="scope.row.copies" size="small" :min="1" :max="99" label="数量"
                      @change="!isPriceManuallyEdited && (form.price = Number(selectedDishTotal.toFixed(2)))" />
                  </template>
                </el-table-column>
                <el-table-column prop="operation" label="アクション" width="180px;" align="center">
                  <template v-slot="scope">
                    <el-button link type="danger" size="small" class="delBut non" @click="delDishHandle(scope.$index)">
                      削除
                    </el-button>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="詳細" :label-width="formLabelWidth" prop="detail">
        <el-input v-model="form.detail" autocomplete="off" type="textarea" />
      </el-form-item>
      <el-form-item label="価格" :label-width="formLabelWidth" prop="price">
        <el-input v-model="form.price" autocomplete="off" @input="onPriceInput" />
        <div style="margin-top: 6px; color: #909399; font-size: 12px;">
          套餐内料理原价合计参考：￥{{ selectedDishTotal.toFixed(2) }}
        </div>
        <el-button link type="primary" @click="resetPriceSuggestion">料理合計で再計算</el-button>
      </el-form-item>
      <el-form-item label="カテゴリ" :label-width="formLabelWidth" prop="categoryId">
        <el-select clearable v-model="form.categoryId" placeholder="カテゴリを選択">
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-form-item class="btn_box">
      <el-button class="submit_btn" type="success" @click="submit(0)">保存して戻る</el-button>
      <el-button v-if="form.id == 0" class="continue_btn" type="success" plain @click="submit(1)">保存して続けて追加</el-button>
      <el-button class="cancel_btn" type="info" plain @click="cancel">キャンセル</el-button>
    </el-form-item>
  </el-card>
</template>

<style scoped lang="less">
h1 {
  font-size: 20px;
  text-align: center;
  margin: 20px;
}

.el-form {
  margin-top: 30px;
  width: 800px;
  margin: 0 auto;
}

img {
  width: 110px;
  height: 100px;
  margin-right: 20px
}

.btn_box {
  display: flex;

  .submit_btn {
    width: 100px;
    height: 40px;
    margin: 30px 0 0 250px;
  }

  .continue_btn {
    width: 120px;
    height: 40px;
    margin: 30px 0 0 50px;
  }

  .cancel_btn {
    width: 100px;
    height: 40px;
    margin: 30px 0 0 300px;
  }
}

.addDish {
  width: 800px;

  .addBut {
    background: #409eff;
    display: inline-block;
    padding: 0px 20px;
    border-radius: 3px;
    line-height: 40px;
    cursor: pointer;
    border-radius: 4px;
    color: #ffffff;
    font-weight: 500;
  }

  .content {
    background: #fafafb;
    padding: 20px;
    border: solid 1px #d8dde3;
    border-radius: 3px;
  }
}

.cropper-wrap {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 180px;
  gap: 16px;
  align-items: start;
  width: 100%;
  overflow: hidden;
}

.cropper-panel {
  min-width: 0;
}

.crop-stage {
  position: relative;
  width: 100%;
  max-height: 260px;
  margin-bottom: 16px;
  overflow: hidden;
}

.crop-form :deep(.el-form-item) {
  margin-bottom: 12px;
}

.crop-form {
  width: 80%;
  max-width: 420px;
  min-width: 220px;
  margin: 0 auto;
}

.crop-form :deep(.el-form-item__content) {
  width: 100%;
  margin-left: 0 !important;
}

.crop-form :deep(.el-slider) {
  width: 100%;
  max-width: 100%;
}

.crop-form :deep(.el-slider__runway) {
  width: 100%;
  max-width: 100%;
  margin-left: 0;
  margin-right: 0;
}

.origin-img {
  width: 100%;
  max-height: 260px;
  object-fit: contain;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  display: block;
}

.crop-box {
  position: absolute;
  top: 0;
  left: 0;
  border: 2px solid #409eff;
  background: rgba(64, 158, 255, 0.15);
  box-sizing: border-box;
  cursor: move;
  max-width: 100%;
  max-height: 100%;
}

.cropper-preview {
  width: 180px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
  box-sizing: border-box;
}

.cropper-preview p {
  margin: 0 0 8px;
  color: #606266;
  font-size: 13px;
}

.cropper-preview img {
  width: 160px;
  height: 160px;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #e4e7ed;
}

@media (max-width: 760px) {
  .cropper-wrap {
    grid-template-columns: minmax(0, 1fr);
  }

  .cropper-preview {
    width: 100%;
  }
}
</style>

<!-- el-dialog的样式修改不能用scoped包起来，要全局，类似其他element组件 -->
<style lang="less">
.addDishList {
  .searchDish {
    position: absolute;
    top: 12px;
    right: 20px;
  }

  .el-dialog__header {
    display: flex;
    padding: 10px 20px 30px 40px;
  }

  .el-dialog__footer {
    padding-top: 27px;
  }

  .el-dialog__body {
    padding: 0;
    border-bottom: solid 1px #efefef;
  }

  .searchDish {
    .el-input__inner {
      height: 40px;
      line-height: 40px;
    }
  }
}
</style>
