import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
import viteCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    // 自动按需引入 Element Plus 组件 API（如 ElMessage、ElMessageBox 等）
    AutoImport({
      resolvers: [ElementPlusResolver()],
      dts: 'src/auto-imports.d.ts',
    }),
    // 自动按需引入 Element Plus 组件（<el-button> 等模板里写的标签）
    Components({
      resolvers: [ElementPlusResolver()],
      dts: 'src/components.d.ts',
    }),
    // 生产环境产物的 gzip 预压缩，配合 nginx gzip_static on 直接吐出 .gz 文件
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // 大于 10KB 的资源才压缩
      deleteOriginFile: false,
    }),
    // 打包体积可视化分析（构建后会生成 dist/stats.html，浏览器打开即可看依赖体积分布）
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  build: {
    // 提升 chunk 警告阈值（拆完包以后大块儿都≤500KB，单独超过的会提示）
    chunkSizeWarningLimit: 800,
    rollupOptions: {
      output: {
        // 手动拆包：把第三方大依赖抽成独立 chunk，便于浏览器长期缓存
        manualChunks: {
          // Vue 全家桶（变化频率极低）
          'vue-vendor': ['vue', 'vue-router', 'pinia', 'pinia-plugin-persistedstate'],
          // ECharts 单独成包（最大头，约 900KB），按需的页面才会加载
          'echarts': ['echarts'],
          // axios 之类的工具
          'utils-vendor': ['axios'],
        },
      },
    },
  },
  // 开启代理
  server: {
    // host: '0.0.0.0',
    // port: 5173,
    // open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8080/admin',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/api/, ''),
        ws: false
      },
      // 与 Spring Boot 同端口（Jakarta WebSocket 与 HTTP 共用 8080）
      '/ws': {
        target: 'ws://localhost:8080',
        changeOrigin: true,
        ws: true
      }
    }
    
  }
})
