import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'

// Import the functions you need from the SDKs you need
import { Provider } from 'jotai'
import { globalStore } from './stores'
import editorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import jsonWorker from 'monaco-editor/esm/vs/language/json/json.worker?worker'
import cssWorker from 'monaco-editor/esm/vs/language/css/css.worker?worker'
import htmlWorker from 'monaco-editor/esm/vs/language/html/html.worker?worker'
import tsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'
enableMapSet()

const lang = 'zh-CN'
initI18n(lang)

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
  <Provider store={globalStore}>
    <App />
  </Provider>
)

postMessage({ payload: 'removeLoading' }, '*')
