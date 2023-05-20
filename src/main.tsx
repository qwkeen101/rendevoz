import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'

// Import the functions you need from the SDKs you need
import { Provider } from 'jotai'
import { globalStore } from './stores'

enableMapSet()

const lang = 'zh-CN'
initI18n(lang)

const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={globalStore}>
    <App />
  </Provider>
)

postMessage({ payload: 'removeLoading' }, '*')
