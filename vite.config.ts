import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      // This tells Vite that "@" means the "src" folder inside "sra-frontend"
      "@": path.resolve(__dirname, "./sra-frontend/src"),
    },
  },
  build: {
    // This ensures the build happens relative to the root
    outDir: 'dist',
  }
})