<script lang="ts" setup>
import { computed, reactive, ref } from 'vue'
import { getEmployeeByIdAPI, updateEmployeeAPI } from '@/api/employee'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useUserInfoStore } from '@/store'
import { resolveImageUrl } from '@/utils/image'

// ------ 数据 ------
let userInfoStore = useUserInfoStore()

const formLabelWidth = '60px'
const id = ref()
const form = reactive({
  id: 0,
  name: '',
  account: '',
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
const updateRef = ref()
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
const outputMaxBytes = 500 * 1024
const maxCropSize = computed(() => Math.min(crop.naturalWidth, crop.naturalHeight))
const minCropSize = computed(() => Math.min(80, maxCropSize.value || 80))
const maxX = computed(() => Math.max(crop.naturalWidth - crop.size, 0))
const maxY = computed(() => Math.max(crop.naturalHeight - crop.size, 0))
const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

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
    { validator: checkAge, trigger: 'blur'}
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

const getBase64Size = (base64: string) => {
  const content = base64.split(',')[1] || ''
  return Math.ceil((content.length * 3) / 4)
}

const createCroppedBase64 = async () => {
  if (!selectedImageData.value || crop.size <= 0) {
    return ''
  }
  const image = await loadImage(selectedImageData.value)
  let renderSize = crop.size
  let quality = 0.9
  const minRenderSize = 240
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

const openCropDialog = async (file: File) => {
  if (!file.type.startsWith('image/')) {
    ElMessage.warning('画像ファイルを選択してください')
    return
  }
  selectedImageData.value = await fileToDataUrl(file)
  const image = await loadImage(selectedImageData.value)
  crop.naturalWidth = image.width
  crop.naturalHeight = image.height
  crop.size = Math.min(image.width, image.height)
  crop.x = Math.floor((image.width - crop.size) / 2)
  crop.y = Math.floor((image.height - crop.size) / 2)
  cropDialogVisible.value = true
  await updateCropPreview()
}

// 在文件管理器中选择图片后触发的改变事件：预览 + 裁剪
const onFileChange1 = async (e: Event) => {
  const target = e.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    await openCropDialog(files[0])
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

// 修改员工信息后提交（只有管理员才能对其他员工进行修改，否则普通员工只能对自己进行修改）
const submit = async () => {
  try {
    const valid = await updateRef.value.validate();
    if (valid) {
      console.log('submit')
      console.log(form)
      // 在这里执行表单提交操作，比如调用updateUser(form)方法等
      const res = await updateEmployeeAPI(form)
      if (res.data.code !== 1) {
        // 响应拦截器已经用ElMessage打印了错误信息，这里直接return
        return false
      }
      // 如果修改的是当前用户信息，那么可能会更新当前登录系统员工的账号，即需要更新store的account值
      console.log('当前userInfo.id')
      console.log(userInfoStore.userInfo)
      if (userInfoStore.userInfo && userInfoStore.userInfo.id === form.id) {
        let { data: employee } = await getEmployeeByIdAPI(form.id)
        console.log('查询修改后的员工')
        console.log(employee)
        if (userInfoStore.userInfo) {
          userInfoStore.userInfo.userName = employee.data.account
        }
      }
      // 然后进行 消息提示，页面跳转 等操作
      ElMessage({
        message: '更新しました',
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
  if (route.query) {
    id.value = route.query.id || 0
    form.id = id.value
    let employee = await getEmployeeByIdAPI(id.value)
    // 真服了，下面这种常规写法丢失响应式！因为对象重新赋值会分配新的引用地址，其指向的对象是新对象，因此丢失响应式！
    // form = song.data.data
    // 重新赋值，不改变引用的写法
    console.log(employee)
    Object.assign(form, employee.data.data)
    console.log(form)
  } else {
    console.log('没有id')
  }
  console.log(id)
}

init()
</script>

<template>
  <h1>スタッフを編集</h1>
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

    <el-form :model="form" :rules="rules" ref="updateRef">
      <el-form-item label="氏名" :label-width="formLabelWidth" prop="name">
        <el-input v-model="form.name" autocomplete="off" />
      </el-form-item>
      <el-form-item label="アカウント" :label-width="formLabelWidth" prop="account">
        <el-input v-model="form.account" autocomplete="off" />
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
    <el-form-item class="btn_box">
      <el-button class="submit_btn" type="success" @click="submit">更新</el-button>
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

.btn_box {
  display: flex;
  justify-content: center;


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
