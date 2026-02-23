import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    proxy: {
      // API proxy - avoids CORS, requests go to same origin
      '/api': {
        target: 'https://prod.brahmakosh.com',
        changeOrigin: true,
      },
      // Socket.IO proxy - required for WebSocket to work in dev
      '/socket.io': {
        target: 'https://prod.brahmakosh.com',
        ws: true,
        changeOrigin: true,
      },
    },
  },
})
