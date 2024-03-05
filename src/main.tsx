import { enableMapSet, enablePatches } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'
import { Provider } from 'jotai'
import { Hooks, Utils } from 'rendevoz'

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

const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={Hooks.globalStore}>
    <App />
  </Provider>
)
