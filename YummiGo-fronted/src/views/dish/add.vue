<script lang="ts" setup>
import { computed, reactive, ref, watch } from 'vue'
import SelectInput from './components/SelectInput.vue'
import { addDishAPI, getDishByIdAPI, updateDishAPI } from '@/api/dish'
import { getCategoryPageListAPI } from '@/api/category'
import { uploadImageAPI } from '@/api/common'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { resolveImageUrl as resolveImageUrlByRule } from '@/utils/image'

// ------ 数据 ------
// 固定死数据，应该不用响应式吧？
const dishFlavorsData = [
  { name: '味付け', list: ['プレーン', 'トマト', '黒胡椒', 'サラダ', '麻辣'] },
  { name: '甘さ', list: ['無糖', '少なめ', '半分', '多め', '全糖'] },
  { name: '温度', list: ['ホット', '常温', '氷なし', '少氷', '多氷'] },
  { name: '苦手', list: ['ネギなし', 'ニンニクなし', '香菜なし', '辛さ控えめ'] },
  { name: '辛さ', list: ['辛くない', '微辛', '中辛', '激辛'] }
]

interface Category {
  id: number
  name: string
}

interface DishFlavor {
  name: string
  list: any[]
}
interface LeftDishFlavors {
  name: string
  list: any[]
}
// 菜品id对应的分类列表，即categoryId字段不能只展示id值，应该根据id查询到对应的分类名进行回显
const categoryList = ref<Category[]>([])
const leftDishFlavors = ref<LeftDishFlavors[]>([])
const formLabelWidth = '70px'

const form = reactive({
  id: 0,
  name: '',
  pic: '',
  dishFlavors: [] as DishFlavor[],
  detail: '',
  price: '',
  status: '',
  categoryId: ''
})
const count = ref(0)
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
const outputMaxBytes = 900 * 1024
const maxCropSize = computed(() => Math.min(crop.naturalWidth, crop.naturalHeight))
const minCropSize = computed(() => Math.min(80, maxCropSize.value || 80))
const maxX = computed(() => Math.max(crop.naturalWidth - crop.size, 0))
const maxY = computed(() => Math.max(crop.naturalHeight - crop.size, 0))
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
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
    context.drawImage(image, crop.x, crop.y, crop.size, crop.size, 0, 0, canvas.width, canvas.height)
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
    const file = await dataUrlToFile(croppedPreview.value, `dish-${Date.now()}.jpg`)
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

// 按钮 - 添加口味
const addFlavor = () => {
  console.log('addFlavor')
  console.log('form.dishFlavors.length  ', form.dishFlavors.length)
  console.log('leftDishFlavors.value.length  ', leftDishFlavors.value.length)
  console.log('dishFlavorsData.length  ', dishFlavorsData.length)
  form.dishFlavors.push({ name: '', list: [] }) // JSON.parse(JSON.stringify(form.dishFlavorsData))
  console.log('添加数据倒是改变watch啊！', form.dishFlavors)
  // getLeftDishFlavors()
  count.value++
}
const change = () => {
  console.log('watch 函数监听 count 变化，执行相应change回调 - getLeftDishFlavor')
}
watch(count, change)


// 按钮 - 删除口味
const delFlavor = (name: string) => {
  let ind = form.dishFlavors.findIndex(item => item.name === name)
  form.dishFlavors.splice(ind, 1)
  console.log('删除了', form.dishFlavors)
}

// 按钮 - 删除口味标签
const delFlavorLabel = (index: number, ind: number) => {
  console.log('delete ind', ind)
  // 打印 form.dishFlavors[index] 的类型
  console.log(typeof form.dishFlavors[index])
  console.log(form.dishFlavors[index].list)
  form.dishFlavors[index].list.splice(ind, 1)
}

// 过滤已选择的口味下拉框无法再次选择
const getLeftDishFlavors = () => {
  let arr: any = []
  dishFlavorsData.map(item => {
    // 遍历dishFlavors，如果其中所有item1都没有一个和item相等，那么会返回-1，符合未选的条件，push到arr中
    if (form.dishFlavors.findIndex(item1 => item.name === item1.name) === -1) {
      arr.push(item)
    }
  })
  console.log('getLeftDishFlavors', arr)
  leftDishFlavors.value = arr
}
const changeDishFlavors = () => {
  console.log('watch 函数监听 dishFlavors 变化，执行相应change回调 - getLeftDishFlavor')
  getLeftDishFlavors()
}
// 使用 watch 函数监听 dishFlavors 属性的变化，变化就执行相应change回调，动态更新leftDishFlavors
watch(() => form.dishFlavors, changeDishFlavors, { deep: true })

// 根据左侧选中的口味属性值，更新右侧框的口味数组元素
// val: item.name,   key: 左侧框中的口味索引,   ind: 对应在dishFlavorsData中的口味索引
const selectHandle = (val: any, key: any, ind: any) => {
  console.log('根据左侧选中的口味属性值，更新右侧框的口味数组元素: selectHandle', val, key, ind)
  const arrDate = [...form.dishFlavors]
  console.log('arrDate', arrDate)
  const index = dishFlavorsData.findIndex(item => item.name === val)
  arrDate[key] = JSON.parse(JSON.stringify(dishFlavorsData[index]))
  form.dishFlavors = arrDate
}

// 添加菜品信息后提交
const submit = async (keep: any) => {
  const valid = await addRef.value.validate();
  if (valid) {
    let params: any = { ...form }
    console.log('看看有没有拷贝成功？', params)
    // 需要先对口味数组进行json.stringfy序列化
    params.flavors = form.dishFlavors.map(obj => ({
      ...obj,
      list: JSON.stringify(obj.list)
    }))
    params.image = form.pic
    params.description = form.detail
    delete params.dishFlavors
    delete params.pic
    delete params.detail
    console.log('看看有没有serialize成功？', params)
    // --- 处理完毕，开始提交 ---
    // 情况1：无路径参数，form.id保持默认值0，新增菜品
    if (form.id === 0) {
      console.log('新增菜品')
      const res = await addDishAPI(params)
      if (res.data.code !== 1) {
        console.log('新增菜品失败！')
        return false
      }
      ElMessage({
        message: '料理を追加しました',
        type: 'success',
      })
      // 根据keep决定是否继续添加
      if (keep) {
        form.id = 0
        form.name = ''
        form.pic = ''
        form.dishFlavors = []
        form.detail = ''
        form.price = ''
        form.status = ''
        form.categoryId = ''
        getLeftDishFlavors()
      } else {
        router.push({
          path: '/dish',
        })
      }
    }
    // 情况2：有路径参数，修改菜品
    else {
      console.log('修改菜品')
      const res = await updateDishAPI(params)
      if (res.data.code !== 1) {
        console.log('修改菜品失败！')
        return false
      }
      ElMessage({
        message: '更新しました',
        type: 'success',
      })
      router.push({
        path: '/dish',
      })
    }

  } else {
    console.log('form not valid!');
    return false;
  }
}
// 取消修改
const cancel = () => {
  router.push({
    path: '/dish',
  })
}

const init = async () => {
  // 1. 获取菜品分类，等下菜品选择分类时有个下拉框，要展示所有菜品的分类
  // 由于复用分页查询的API，这里不需要分页且数据量较少，所以pageSize设置为100
  const { data: res } = await getCategoryPageListAPI({ page: 1, pageSize: 100, type: 1 })
  console.log('分类列表')
  console.log(res.data)
  categoryList.value = res.data.records
  console.log('categoryList: ', categoryList.value)
  // 2. 由于当前页面可能是add也可能是update，所以要根据路由参数来判断是否需要getDishById
  if (route.query.id !== undefined) {
    console.log('修改菜品页')
    form.id = route.query.id ? parseInt(route.query.id as string) : 0
    let dish = await getDishByIdAPI(form.id)
    console.log(dish)
    Object.assign(form, dish.data.data)
    form.pic = dish.data.data?.image || ''
    form.detail = dish.data.data?.description || ''
    console.log(form)
    // 3. 如果是修改页面，需要将口味数组中的list字符串反序列化
    form.dishFlavors =
      dish.data.data.flavors &&
      dish.data.data.flavors.map((obj: any) => ({
        ...obj,
        list: JSON.parse(obj.list)
      }))
    // 4. 初始化左侧未选中的口味数组
    getLeftDishFlavors()
  } else {
    console.log('新增菜品页', form.id)
  }
}

init()
</script>

<template>
  <h1>{{ route.query.id ? '料理を編集' : '料理を追加' }}</h1>
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
      <el-form-item label="オプション:">
        <div class="flavorBox">
          <span v-if="form.dishFlavors.length == 0" class="addBut" @click="addFlavor"> + オプションを追加</span>
          <div v-if="form.dishFlavors.length != 0" class="flavor">
            <div class="title">
              <span>項目名（全角3文字程度）</span>
            </div>
            <div class="cont">
              <div v-for="(item, index) in form.dishFlavors" :key="index" class="items">
                <div class="itTit">
                  <SelectInput :dish-flavors-data="leftDishFlavors" :index="index" :value="item.name"
                    @select="selectHandle" />
                </div>
                <div class="labItems" style="display: flex">
                  <span v-for="(it, ind) in item.list" :key="ind">{{ it }}
                    <i @click="delFlavorLabel(index, ind)">X</i></span>
                  <div class="inputBox"></div>
                </div>
                <span class="delFlavor delBut non" @click="delFlavor(item.name)">削除</span>
              </div>
            </div>
            <div v-if="!!leftDishFlavors.length && form.dishFlavors.length < dishFlavorsData.length" class="addBut"
              @click="addFlavor">
              オプションを追加
            </div>
          </div>
        </div>
      </el-form-item>
      <el-form-item label="詳細" :label-width="formLabelWidth" prop="detail">
        <el-input v-model="form.detail" autocomplete="off" type="textarea" />
      </el-form-item>
      <el-form-item label="価格" :label-width="formLabelWidth" prop="price">
        <el-input v-model="form.price" autocomplete="off" />
      </el-form-item>
      <el-form-item label="カテゴリ" :label-width="formLabelWidth" prop="categoryId">
        <el-select clearable v-model="form.categoryId" placeholder="カテゴリを選択">
          <el-option v-for="item in categoryList" :key="item.id" :label="item.name" :value="item.id" />
        </el-select>
      </el-form-item>
    </el-form>
    <el-form-item>
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

.flavorBox {
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

  .flavor {
    border: solid 1px #dfe2e8;
    border-radius: 3px;
    padding: 15px;
    background: #fafafb;

    .title {
      color: #606168;

      .des-box {
        padding-left: 44px;
      }
    }

    .cont {
      .items {
        display: flex;
        margin: 10px 0;

        .itTit {
          width: 150px;
          margin-right: 15px;

          input {
            width: 100%;
          }
        }

        .labItems {
          flex: 1;
          display: flex;
          flex-wrap: wrap;
          border-radius: 3px;
          min-height: 39px;
          border: solid 1px #d8dde3;
          background: #fff;
          padding: 0 5px;

          span {
            display: inline-block;
            color: #ffc200;
            margin: 5px;
            line-height: 26px;
            padding: 0 10px;
            background: #fffbf0;
            border: 1px solid #fbe396;
            border-radius: 4px;
            font-size: 12px;

            i {
              cursor: pointer;
              font-style: normal;
            }
          }

          .inputBox {
            display: inline-block;
            flex: 1;
            width: 100%;
            height: 36px;
            line-height: 36px;
            overflow: hidden;
          }
        }

        .delFlavor {
          display: inline-block;
          padding: 0 10px;
          color: #f19c59;
          cursor: pointer;
        }
      }
    }
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
