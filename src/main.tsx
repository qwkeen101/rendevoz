import { enableMapSet } from 'immer'
import { createRoot } from 'react-dom/client'
import App from './App'
import initI18n from './config/i18n'
import { initSearchIndex } from './utils/searchIndex'
// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app'
import { getAnalytics } from 'firebase/analytics'
import { Provider } from 'jotai'
import { globalStore } from './stores'
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'REDACTED',
  authDomain: 'rendevoz.firebaseapp.com',
  projectId: 'rendevoz',
  storageBucket: 'rendevoz.appspot.com',
  messagingSenderId: '596265005202',
  appId: '1:596265005202:web:f3e1ebe999d8a6bc76f64b',
  measurementId: 'G-FDEBF02FYJ'
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const analytics = getAnalytics(app)
enableMapSet()
// initSearchIndex()
const lang = 'zh-CN'
initI18n(lang)

const root = createRoot(document.getElementById('root')!)

root.render(
  <Provider store={globalStore}>
    <App />
  </Provider>
)

postMessage({ payload: 'removeLoading' }, '*')
