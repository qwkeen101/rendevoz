import { rmSync } from 'fs'
import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'
import { VitePluginDoubleshot } from 'vite-plugin-doubleshot'
rmSync(path.join(__dirname, 'dist-electron'), { recursive: true, force: true })
const isDev = process.env.NODE_ENV === 'development'
const isProd = process.env.NODE_ENV === 'production'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    'process.env': {}
  },
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
      styles: path.join(__dirname, 'src/assets/styles')
    }
  },
  base: './',
  build: {
    sourcemap: false,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        print: resolve(__dirname, 'printer.html')
      }
    }
  },
  plugins: [
    react(),
    VitePluginDoubleshot({
      type: 'electron',
      main: 'dist-electron/main/index.js',
      entry: 'electron/main/index.ts',
      outDir: 'dist-electron/main',
      external: ['electron'],
      electron: {
        build: {
          config: './electron-builder.json5'
        },
        preload: {
          entry: 'electron/preload/index.ts',
          outDir: 'dist-electron/preload'
        }
      }
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 7777,
    hmr: false
  },
  clearScreen: false
}))
