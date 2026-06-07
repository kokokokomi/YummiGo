<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { addEmployeeAPI } from '@/api/employee'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { resolveImageUrl } from '@/utils/image'

// ------ 数据 ------
const formLabelWidth = '60px'
const form = reactive({
  id: 0,
  name: '',
  account: '',
  password: '',
  phone: '',
  age: '',
  gender: '',
  pic: '',
})
const genders = [
  {
    value: 1,
    label: '男性',
  },
  {
    value: 0,
    label: '女性',
  }
]
const inputRef1 = ref<HTMLInputElement | null>(null)
const addRef = ref()
const cropDialogVisible = ref(false)
const selectedImageData = ref('')
const croppedPreview = ref('')
const crop = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
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
const outputMaxBytes = 500 * 1024
const minCropEdge = 80
const maxCropWidth = computed(() => Math.max(crop.naturalWidth, 0))
const maxCropHeight = computed(() => Math.max(crop.naturalHeight, 0))
const minCropWidth = computed(() => Math.min(minCropEdge, maxCropWidth.value || minCropEdge))
const minCropHeight = computed(() => Math.min(minCropEdge, maxCropHeight.value || minCropEdge))
const maxX = computed(() => Math.max(crop.naturalWidth - crop.width, 0))
const maxY = computed(() => Math.max(crop.naturalHeight - crop.height, 0))
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeCropValue = () => {
  const safeNaturalWidth = Number.isFinite(crop.naturalWidth) ? crop.naturalWidth : 0
  const safeNaturalHeight = Number.isFinite(crop.naturalHeight) ? crop.naturalHeight : 0
  const safeMaxCropWidth = Math.max(safeNaturalWidth, 0)
  const safeMaxCropHeight = Math.max(safeNaturalHeight, 0)
  const safeMinCropWidth = Math.min(minCropEdge, safeMaxCropWidth || minCropEdge)
  const safeMinCropHeight = Math.min(minCropEdge, safeMaxCropHeight || minCropEdge)
  if (safeMaxCropWidth <= 0 || safeMaxCropHeight <= 0) {
    crop.width = 0
    crop.height = 0
    crop.x = 0
    crop.y = 0
    return
  }
  const safeWidth = Number.isFinite(crop.width) ? crop.width : safeMinCropWidth
  const safeHeight = Number.isFinite(crop.height) ? crop.height : safeMinCropHeight
  crop.width = clamp(safeWidth, safeMinCropWidth, safeMaxCropWidth)
  crop.height = clamp(safeHeight, safeMinCropHeight, safeMaxCropHeight)
  const safeMaxX = Math.max(safeNaturalWidth - crop.width, 0)
  const safeMaxY = Math.max(safeNaturalHeight - crop.height, 0)
  const safeX = Number.isFinite(crop.x) ? crop.x : 0
  const safeY = Number.isFinite(crop.y) ? crop.y : 0
  crop.x = clamp(safeX, 0, safeMaxX)
  crop.y = clamp(safeY, 0, safeMaxY)
}

const cropBoxStyle = computed(() => {
  if (!cropImageRef.value || crop.naturalWidth <= 0 || crop.naturalHeight <= 0 || crop.width <= 0 || crop.height <= 0) {
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
    width: `${Math.max(crop.width * widthRatio, 0)}px`,
    height: `${Math.max(crop.height * heightRatio, 0)}px`,
    transform: `translate(${Math.max(crop.x * widthRatio, 0)}px, ${Math.max(crop.y * heightRatio, 0)}px)`,
  }
})

// 表单校验
const checkAge = (rule: any, value: string, callback: (error?: Error) => void) => {
  if (value === '' || value === undefined) {
    callback(new Error('年齢を入力してください'));
  } else if (!/^\d+$/.test(value)) {
    callback(new Error('数字で入力してください'));
  } else {
    const age = parseInt(value);
    if (age < 3) {
      callback(new Error('年齢は3以上で入力してください'));
    } else if (age > 99) {
      callback(new Error('年齢は99以下で入力してください'));
    } else {
      callback();
    }
  }
}
const rules = {
  name: [
    { required: true, trigger: 'blur', message: '必須項目です' },
    { min: 2, message: '氏名は2文字以上で入力してください', trigger: 'blur' },
    { max: 20, message: '氏名は20文字以内で入力してください', trigger: 'blur' },
  ],
  account: [
    { required: true, trigger: 'blur', message: '必須項目です' },
    { pattern: /^[a-zA-Z0-9]{1,10}$/, message: '半角英数字1〜10文字', trigger: 'blur' }
  ],
  password: [
    { required: true, trigger: 'blur', message: '必須項目です' },
    { pattern: /^\S{6,15}$/, message: '6〜15文字の空白以外の文字', trigger: 'blur' }
  ],
  phone: [
    { required: true, trigger: 'blur', message: '必須項目です' },
    { pattern: /^1[3-9]\d{9}$/, message: '携帯番号の形式が正しくありません', trigger: 'blur' }
  ],
  age: [
    { required: true, trigger: 'blur', message: '必須項目です' },
    { validator: checkAge, trigger: 'blur' }
  ],
  gender: [
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

const loadImageFromFile = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const blobUrl = URL.createObjectURL(file)
    const image = new Image()
    image.onload = () => {
      URL.revokeObjectURL(blobUrl)
      resolve(image)
    }
    image.onerror = async (error) => {
      URL.revokeObjectURL(blobUrl)
      try {
        const dataUrl = await fileToDataUrl(file)
        const fallbackImage = await loadImage(dataUrl)
        resolve(fallbackImage)
      } catch {
        reject(error)
      }
    }
    image.src = blobUrl
  })

const getBase64Size = (base64: string) => {
  const content = base64.split(',')[1] || ''
  return Math.ceil((content.length * 3) / 4)
}

const createCroppedBase64 = async () => {
  if (!selectedImageData.value || crop.width <= 0 || crop.height <= 0) {
    return ''
  }
  const image = await loadImage(selectedImageData.value)
  let renderWidth = crop.width
  let renderHeight = crop.height
  let quality = 0.9
  const minRenderEdge = 240
  const canvas = document.createElement('canvas')
  let result = ''
  while (true) {
    canvas.width = Math.floor(renderWidth)
    canvas.height = Math.floor(renderHeight)
    const context = canvas.getContext('2d')
    if (!context) {
      break
    }
    context.clearRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, canvas.width, canvas.height)
    result = canvas.toDataURL('image/jpeg', quality)
    if (getBase64Size(result) <= outputMaxBytes || (quality <= 0.5 && renderWidth <= minRenderEdge && renderHeight <= minRenderEdge)) {
      break
    }
    if (quality > 0.5) {
      quality -= 0.1
    } else {
      renderWidth = Math.max(Math.floor(renderWidth * 0.8), minRenderEdge)
      renderHeight = Math.max(Math.floor(renderHeight * 0.8), minRenderEdge)
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
  if (crop.width <= 0 || crop.height <= 0 || !cropImageRef.value) {
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

const onCropStagePointerDown = (event: PointerEvent) => {
  if (!cropImageRef.value || crop.width <= 0 || crop.height <= 0 || crop.naturalWidth <= 0 || crop.naturalHeight <= 0) {
    return
  }
  const rect = cropImageRef.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) {
    return
  }
  const offsetX = event.clientX - rect.left
  const offsetY = event.clientY - rect.top
  const rawCenterX = (offsetX / rect.width) * crop.naturalWidth
  const rawCenterY = (offsetY / rect.height) * crop.naturalHeight
  crop.x = rawCenterX - crop.width / 2
  crop.y = rawCenterY - crop.height / 2
  onCropParamChange()
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
    const image = await loadImageFromFile(file)
    crop.naturalWidth = image.width
    crop.naturalHeight = image.height
    crop.width = Math.floor(image.width * 0.7)
    crop.height = Math.floor(image.height * 0.7)
    crop.x = Math.floor((image.width - crop.width) / 2)
    crop.y = Math.floor((image.height - crop.height) / 2)
    cropDialogVisible.value = true
    await updateCropPreview()
  } catch (error) {
    console.error('openCropDialog failed', error)
    ElMessage.error(`画像の読み込みに失敗しました（${file.name || 'unknown'}）。形式を変換して再試行してください。`)
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

const applyCrop = () => {
  if (!croppedPreview.value) {
    ElMessage.warning('画像の裁剪に失敗しました')
    return
  }
  form.pic = croppedPreview.value
  cropDialogVisible.value = false
}

const cancelCrop = () => {
  stopDrag()
  cropDialogVisible.value = false
}

// 添加员工信息后提交（只有管理员才能对其他员工进行修改，否则普通员工只能对自己进行修改）
const submit = async () => {
  try {
    const valid = await addRef.value.validate();
    if (valid) {
      const payload = {
        name: form.name,
        username: form.account,
        phone: form.phone,
        sex: String(form.gender),
      }
      const res = await addEmployeeAPI(payload)
      if (res.data.code !== 1) {
        console.log('新增员工失败！')
        return false
      }
      // 然后进行 消息提示，页面跳转 等操作
      ElMessage({
        message: 'スタッフを追加しました',
        type: 'success',
      })
      router.push({
        path: '/employee',
      })
    } else {
      console.log('form not valid!');
      return false;
    }
  } catch (error) {
    console.error('执行过程中失败:', error);
  }
}
// 取消修改
const cancel = () => {
  router.push({
    path: '/employee',
  })
}

const init = async () => {
  console.log(route.query)
}

init()
</script>

<template>
  <h1>スタッフを追加</h1>
  <el-card>
    <el-dialog v-model="cropDialogVisible" width="700px" title="画像を裁剪" @closed="stopDrag">
      <div class="cropper-wrap">
        <div class="cropper-panel">
          <div class="crop-stage" @pointerdown="onCropStagePointerDown">
            <img ref="cropImageRef" class="origin-img" :src="selectedImageData" alt="origin" />
            <div class="crop-box" :style="cropBoxStyle" @pointerdown.stop.prevent="onCropDragStart" />
          </div>
          <el-form class="crop-form" label-position="top">
            <el-form-item label="幅">
              <el-slider v-model="crop.width" :min="minCropWidth" :max="maxCropWidth" :step="1" @input="onCropSizeChange" />
            </el-form-item>
            <el-form-item label="高さ">
              <el-slider v-model="crop.height" :min="minCropHeight" :max="maxCropHeight" :step="1" @input="onCropSizeChange" />
            </el-form-item>
            <el-form-item label="横位置">
              <el-slider v-model="crop.x" :min="0" :max="maxX" :step="1" @input="onCropParamChange" />
            </el-form-item>
            <el-form-item label="縦位置">
              <el-slider v-model="crop.y" :min="0" :max="maxY" :step="1" @input="onCropParamChange" />
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
      <el-form-item label="氏名" :label-width="formLabelWidth" prop="name">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="アカウント" :label-width="formLabelWidth" prop="account">
        <el-input v-model="form.account" autocomplete="off" />
      </el-form-item>
      <el-form-item label="パスワード" :label-width="formLabelWidth" prop="password">
        <el-input v-model="form.password" autocomplete="off" />
      </el-form-item>
      <el-form-item label="電話" :label-width="formLabelWidth" prop="phone">
        <el-input v-model="form.phone" autocomplete="off" />
      </el-form-item>
      <el-form-item label="年齢" :label-width="formLabelWidth" prop="age">
        <el-input v-model="form.age" autocomplete="off" />
      </el-form-item>
      <el-form-item label="性別" :label-width="formLabelWidth" prop="gender">
        <el-select clearable v-model="form.gender" placeholder="性別を選択">
          <el-option v-for="item in genders" :key="item.value" :label="item.label" :value="item.value" />
        </el-select>
        <!-- <el-input v-model="form.gender" autocomplete="off" /> -->
      </el-form-item>
      <el-form-item label="顔写真" :label-width="formLabelWidth" prop="pic">
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
    </el-form>
    <el-form-item>
      <el-button class="submit_btn" type="success" @click="submit">追加</el-button>
      <el-button class="cancel_btn" type="info" plain @click="cancel">キャンセル</el-button>
    </el-form-item>
  </el-card>
</template>

<style lang="less" scoped>
h1 {
  font-size: 20px;
  text-align: center;
  margin: 20px;
}

.el-form {
  margin-top: 30px;
  width: 500px;
  margin: 0 auto;
}

img {
  width: 50px;
  height: 50px;
  margin-right: 20px;
}

.submit_btn {
  width: 100px;
  height: 40px;
  margin: 30px 0 0 400px;
}

.cancel_btn {
  width: 100px;
  height: 40px;
  margin: 30px 0 0 200px;
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
