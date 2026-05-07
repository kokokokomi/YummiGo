import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
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
