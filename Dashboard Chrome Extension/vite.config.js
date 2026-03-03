import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Chrome Extensions strictly require relative asset paths. 
// This configuration forces the compiler to use './' instead of '/'
export default defineConfig({
  plugins: [react()],
  base: './', 
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
