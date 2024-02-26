import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
// @ts-ignore
export default defineConfig(() => ({
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true
      }
    }
  },
  worker: {
    format: 'es'
  },
  define: {
    APP_VERSION: JSON.stringify(process.env.npm_package_version),
    'process.env': {}
  },
  resolve: {
    alias: {
      stream: 'stream-browserify',
      cheerio: path.resolve(__dirname, './node_modules/cheerio'),
      '@': path.join(__dirname, 'src'),
      styles: path.join(__dirname, 'src/assets/styles')
    }
  },
  base: './',
  optimizeDeps: {
    include: ['retry', 'fix-webm-duration'],
    exclude: ['canvas', 'whisper-turbo', '@ffmpeg', '@ffmpeg/ffmpeg']
  },
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
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/main'
          }
        }
      },
      preload: {
        input: __dirname + '/electron/preload/index.ts',
        vite: {
          build: {
            outDir: 'dist-electron/preload'
          }
        }
      }
    })
  ],
  server: {
    host: '127.0.0.1',
    port: 7777
  },
  clearScreen: false
}))
