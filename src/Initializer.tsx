import { useEffect } from 'react'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './stores'
import { atom } from 'jotai'
import { useGlobalAtom, useGlobalSetAtom } from './hooks/jotai'
import { ipcInstance } from './plugins'
import { loginStateAtom } from './components/Login'
import LoginService, { userAtom } from './services/login.service'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'

export const initializedAtom = atom(false)
export const updateInfoAtom = atom<
  | {
      version: string
    }
  | undefined
>(undefined)
let autoLogined = false
const Initializer = () => {
  const [loginState] = useGlobalAtom(loginStateAtom)
  const [, setUser] = useGlobalAtom(userAtom)
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllCollections } = CollectionStore
  const setIntialized = useGlobalSetAtom(initializedAtom)
  const { t } = useTranslation()
  useEffect(() => {
    if (loginState.autoLogin && loginState.password && !autoLogined) {
      const email = localStorage.getItem('email')
      if (email) {
        LoginService.login(email, loginState.password)
          .then(data => {
            LoginService.getUserDetails(email, data.data.token)
              .then(user => {
                localStorage.setItem('email', user.data.email || '')
                setUser(user.data)
              })
              .catch(e => toast.error(`${t('login.failed to get user details')}!`))
              .finally(() => {
                if (loginState.autoLogin) {
                  autoLogined = true
                }
              })
          })
          .catch(e => {
            toast.error(`${t('login.failed to login')}!`)
          })
      }
    }
    Promise.all([
      getAllMetaLinks(),
      getAllMetaObjects(),
      getAllCollections(),
      ObjectStore('tag').getAll(),
      ObjectStore('pdfLabel').getAll()
    ]).then(() => {
      setIntialized(true)
    })
    ipcInstance.send('getUpdateDetails').then(res => {
      globalStore.set(updateInfoAtom, {
        version: res.data.version
      })
    })
    console.log(`
    Welcome to use Rendevoz to BOOST your work efficency 💪🏻!
    If you meet any problem or just interested in how I developed this, just contact me 💬!

    🧙🏻‍♂️ RealRong 2001.
    `)
    if (import.meta.env.PROD) {
      console.log = (function (origin) {
        return function () {}
      })(console.log)
    }
  }, [])
  return null
}

export default Initializer
