import path, { resolve } from 'path'
import { defineConfig } from 'vite'
import electron from 'vite-plugin-electron/simple'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import wasm from 'vite-plugin-wasm'
import topLevelAwait from 'vite-plugin-top-level-await'

// https://vitejs.dev/config/
// @ts-ignore
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
      stream: 'stream-browserify',
      // The rendevoz npm package was unpublished; build it from its source in _rendevoz/
      rendevoz: path.join(__dirname, '_rendevoz/src/index.ts'),
      '@': path.join(__dirname, 'src'),
      styles: path.join(__dirname, 'src/assets/styles')
    }
  },
  base: './',
  optimizeDeps: {
    include: ['retry'],
    exclude: ['canvas']
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        print: resolve(__dirname, 'printer.html')
      }
    }
  },
  plugins: [
    wasm(),
    topLevelAwait(),
    {
      name: 'clean-dist-electron',
      async buildStart() {
        if (command === 'build') {
          const distElectronPath = resolve(__dirname, 'dist-electron')
          fs.rmSync(distElectronPath, { recursive: true, force: true })
        }
      }
    },
    react(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          optimizeDeps: {
            exclude: ['sharp']
          },
          build: {
            rollupOptions: {
              output: {
                externalLiveBindings: false
              },
              external: s => {
                if (s.includes('onnxruntime') || s.includes('sharp') || s.includes('usearch')) {
                  console.log(s)
                  return true
                }
                return false
              }
            },
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
    port: 7777,
    hmr: true
  },
  worker: {
    format: 'es',
    plugins: [wasm(), topLevelAwait()]
  },
  clearScreen: false
}))
