// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc' // Essential partner for JSX
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./sra-frontend/src"),
    },
  },
})