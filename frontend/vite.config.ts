import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const allowedHosts = ['localhost', '127.0.0.1', '.trycloudflare.com']

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts,
    proxy: {
      '/api': 'http://127.0.0.1:8080',
      // `/admin` is the React admin page. Only `/admin/...` is a backend API prefix.
      '^/admin/.+': 'http://127.0.0.1:8080',
    },
  },
  preview: {
    allowedHosts,
  },
})
