import { enableMapSet, enablePatches } from 'immer'
import { createRoot } from 'react-dom/client'
import initI18n from './config/i18n'
import { Provider } from 'jotai'
import App from './App'
import DateFormat from './utils/dateFormat'
import { globalStore } from '@/api/stores'

window.DateFormat = DateFormat
enableMapSet()
enablePatches()
const lang = navigator.language === 'zh-CN' ? navigator.language : 'en-US'
initI18n(lang)
// 禁止focus滚动页面
const originalFocus = HTMLElement.prototype.focus

// 重写 focus 方法
HTMLElement.prototype.focus = function (options) {
  if (options === undefined || typeof options !== 'object') {
    options = {}
  }

  // 默认 preventScroll 为 true
  options.preventScroll = true
  originalFocus.call(this, options)
}

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
// fileHandle?.getDirectoryHandle('imgs').then(i => {
//   i.getFileHandle(replaced)
//     .then(h => h.getFile())
//     .then(file => {
//       const url = URL.createObjectURL(file)
//       set.call(this, url)
//       // console.log(file)
//     })
// })
// }

const root = createRoot(document.getElementById('root')!)
document.body.spellcheck = false
root.render(
  <Provider store={globalStore}>
    <App />
  </Provider>
)
