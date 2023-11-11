import { enableMapSet, enablePatches } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'
import * as PIXI from 'pixi.js'
import PIXIFontUrl from '@/assets/font.xml?url'
import { Provider } from 'jotai'
import { Hooks } from 'rendevoz'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
PIXI.Assets.load(PIXIFontUrl)
enableMapSet()
enablePatches()
const lang = 'zh-CN'
initI18n(lang)

document.addEventListener(
  'error',
  e => {
    if (e.target instanceof HTMLImageElement) {
      e.target.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mO8Ww8AAj8BXkQ+xPEAAAAASUVORK5CYII='
    }
  },
  true
)
// const userAgent = navigator.userAgent.toLowerCase()
// if (userAgent.indexOf(' electron/') <= -1) {
//   let fileHandle: FileSystemDirectoryHandle | undefined = undefined
//   document.body.addEventListener('click', () => {
//     if (!fileHandle)
//       window.showDirectoryPicker().then(res => {
//         fileHandle = res
//         fileHandle.requestPermission({ mode: 'readwrite' })
//       })
//   })
//
//   const { get, set } = Object.getOwnPropertyDescriptor(Image.prototype, 'src')!
//   Object.defineProperty(Image.prototype, 'src', {
//     set(newVal) {
//       if (newVal.startsWith('rendefile')) {
//         const replaced = newVal.replace('rendefile:///imgs/', '')
//         fileHandle?.getDirectoryHandle('imgs').then(i => {
//           i.getFileHandle(replaced)
//             .then(h => h.getFile())
//             .then(file => {
//               const url = URL.createObjectURL(file)
//               set.call(this, url)
//               // console.log(file)
//             })
//         })
//
//         return set.call(this, replaced)
//       }
//       return set.call(this, newVal)
//     },
//     get() {
//       return get.call(this)
//     }
//   })
// }

self.MonacoEnvironment = {
  getWorker: function (_, label) {
    if (label === 'json') {
      return new jsonWorker()
    }
    if (label === 'css' || label === 'scss' || label === 'less') {
      return new cssWorker()
    }
    if (label === 'html' || label === 'handlebars' || label === 'razor') {
      return new htmlWorker()
    }
    if (label === 'typescript' || label === 'javascript') {
      return new tsWorker()
    }
    return new editorWorker()
  }
}

const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={Hooks.globalStore}>
    <App />
  </Provider>
)

postMessage({ payload: 'removeLoading' }, '*')
