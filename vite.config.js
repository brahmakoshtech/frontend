import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'

const suppress = ['ECONNRESET', 'ECONNREFUSED', 'EPIPE'];

export default defineConfig({
  plugins: [vue(), vueJsx()],
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'unsafe-none',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    // Use a separate port for Vite HMR so it never conflicts with /socket.io proxy
    hmr: { port: 5174 },
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (!suppress.includes(err.code)) console.log('api proxy error', err.message);
          });
        },
      },
      // Handles BOTH Engine.IO HTTP polling (/socket.io/?transport=polling)
      // AND WebSocket upgrade (/socket.io/?transport=websocket)
      '/socket.io': {
        target: 'http://localhost:5000',
        ws: true,
        changeOrigin: true,
        rewriteWsOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err) => {
            if (!suppress.includes(err.code)) console.log('socket proxy error', err.message);
          });
          proxy.on('proxyReqWs', (proxyReq) => {
            proxyReq.setHeader('origin', 'http://localhost:5000');
          });
        },
      },
    },
  },
})