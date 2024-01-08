// vite.config.js
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import pkg from './package.json'
import react from '@vitejs/plugin-react'

export default defineConfig({
  build: {
    target: 'es2020',
    lib: {
      // Could also be a dictionary or array of multiple entry points
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'rendevoz',
      // the proper extensions will be added
      fileName: 'index',
      formats: ['es']
    },
    rollupOptions: {
      external: Object.keys(pkg.devDependencies)
    }
  },
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      '~': path.resolve(__dirname),
      styles: path.join(__dirname, 'src/assets/styles')
    }
  }
})
