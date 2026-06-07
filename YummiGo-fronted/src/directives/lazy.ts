import type { App, Directive } from 'vue'

/**
 * 图片懒加载指令 v-lazy
 * 基于 IntersectionObserver，当图片进入可视区域附近（提前 200px）才真正发起请求
 *
 * 用法：
 *   <img v-lazy="resolveImageUrl(row.image)" alt="" />
 *
 * 兜底：
 *   - 不支持 IntersectionObserver 的浏览器（极少见）：直接退化为立即加载
 *   - 加载失败：使用配置的 errorPlaceholder
 */

// 1x1 透明 PNG，作为图片显示前的占位（避免布局抖动）
const TRANSPARENT_PLACEHOLDER =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII='

// 加载失败时的占位图（沿用项目里现有的默认图，可按需替换）
const ERROR_PLACEHOLDER = '/src/assets/image/user_default.png'

let observer: IntersectionObserver | null = null

const supportsIO = typeof window !== 'undefined' && 'IntersectionObserver' in window

const loadImage = (img: HTMLImageElement) => {
  const realSrc = img.dataset.src
  if (!realSrc) return
  const tmp = new Image()
  tmp.onload = () => {
    img.src = realSrc
    img.removeAttribute('data-src')
  }
  tmp.onerror = () => {
    img.src = ERROR_PLACEHOLDER
    img.removeAttribute('data-src')
  }
  tmp.src = realSrc
}

const getObserver = () => {
  if (observer) return observer
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement
          loadImage(img)
          observer!.unobserve(img)
        }
      })
    },
    { rootMargin: '200px 0px' }, // 距视口 200px 时就开始加载，给用户「永远是已加载」的体感
  )
  return observer
}

export const vLazy: Directive<HTMLImageElement, string> = {
  mounted(el, binding) {
    if (!binding.value) return
    if (!supportsIO) {
      el.src = binding.value
      return
    }
    el.dataset.src = binding.value
    el.src = TRANSPARENT_PLACEHOLDER
    getObserver().observe(el)
  },
  updated(el, binding) {
    if (binding.value === binding.oldValue) return
    if (!binding.value) {
      el.src = ERROR_PLACEHOLDER
      return
    }
    if (!supportsIO) {
      el.src = binding.value
      return
    }
    el.dataset.src = binding.value
    getObserver().observe(el)
  },
  unmounted(el) {
    if (supportsIO) {
      getObserver().unobserve(el)
    }
  },
}

export default {
  install(app: App) {
    app.directive('lazy', vLazy)
  },
}
