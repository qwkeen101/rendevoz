import { enableMapSet, enablePatches } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'
import * as PIXI from 'pixi.js'
import PIXIFontUrl from '@/assets/font.xml?url'
import { Provider } from 'jotai'
import { Hooks, Utils } from 'rendevoz'
import getWbiKeys from '@/api/services/bilibili/getWbi'
function debounce(func, timeout = 600) {
  let timer
  return (...args) => {
    clearTimeout(timer)
    timer = setTimeout(() => {
      func.apply(this, args)
    }, timeout)
  }
}

window.addEventListener(
  'scroll',
  e => {
    if (e.target instanceof Element) {
      if (!e.target.classList.contains('on-scrollbar')) {
        e.target.classList.add('on-scrollbar')
        e.target.classList.remove('hide-scrollbar')
      }
    }
  },
  true
)
console.log(navigator.languages, navigator.language)
window.addEventListener(
  'scroll',
  debounce(e => {
    e.target.classList.remove('on-scrollbar')
    e.target.classList.add('hide-scrollbar')
    setTimeout(() => {
      if (!e.target.classList.contains('on-scrollbar')) {
        e.target.classList.remove('hide-scrollbar')
      }
    }, 250)
  }),
  true
)
PIXI.Assets.load(PIXIFontUrl)
enableMapSet()
enablePatches()
const lang = Utils.Navigator.getDefaultLanguage()
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
const dm_rand = 'ABCDEFGHIJK'
getWbiKeys({
  mid: 1940623777
}).then(i =>
  fetch('https://api.bilibili.com/x/space/wbi/arc/search?' + i
  )
)
const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={Hooks.globalStore}>
    <App />
  </Provider>
)
