import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      // 開発時のみ: アバター等の静的ファイルを FastAPI から取得
      '/static': {
        target: 'http://localhost:8000',
        changeOrigin: true,
      },
    },
  },
  // 本番時: FastAPI が同一オリジンで /static, /assets, /* をすべて配信
})
