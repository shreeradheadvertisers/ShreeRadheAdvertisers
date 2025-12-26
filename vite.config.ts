import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'path'

export default defineConfig({
  root: './', 
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      // Align alias with your specific subfolder structure
      "@": path.resolve(__dirname, "./sra-frontend/src"),
    },
  },
  build: {
    // Ensure the final build folder is at the root for easy Hostinger upload
    outDir: 'dist',
    emptyOutDir: true,
  }
})