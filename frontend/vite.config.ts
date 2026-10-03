import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = ['localhost', '127.0.0.1', '.trycloudflare.com']
const apiProxyTarget = process.env.API_PROXY_TARGET || 'http://127.0.0.1:8080'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts,
    proxy: {
      '/api': apiProxyTarget,
      // `/admin` is the React admin page. Only `/admin/...` is a backend API prefix.
      '^/admin/.+': apiProxyTarget,
    },
  },
  preview: {
    allowedHosts,
  },
})
