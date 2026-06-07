/// <reference types="vite/client" />

// 让模板中使用的全局自定义指令获得 TS 类型支持
import type { Directive } from 'vue'

declare module 'vue' {
  interface ComponentCustomProperties {
    vLazy: Directive<HTMLImageElement, string>
  }
}

export {}
