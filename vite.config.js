import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/ServiceOps_Dashboard_v2/',
  plugins: [vue()],
  server: { port: 5180, open: false, host: true },
})
