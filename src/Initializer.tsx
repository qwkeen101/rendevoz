import { atom } from 'jotai'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { loginStateAtom } from './components/Login'
import { SettingAtom } from './core'
import { useGlobalAtom, useGlobalAtomValue, useGlobalSetAtom } from '@/hooks'
import { ipcInstance } from './electron'
import LoginService, { userAtom } from './api/services/login.service'
import { globalStore } from './api/stores'
import { Rendevoz } from '@/core/rendevoz'
import '@/api/lifycycle/close/close'
import initializeApp from '@/api/lifycycle/startup/initializeApp'
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
  const setIntialized = useGlobalSetAtom(initializedAtom)
  const { t } = useTranslation()
  const setting = useGlobalAtomValue(SettingAtom)
  useEffect(() => {
    if (setting.general.userFilePath) {
      // const pluginsFolder = `${setting.general.userFilePath}/plugins`
      // ipcInstance.send('installPlugins', pluginsFolder).then(res => {
      //   const { data } = res
      //   if (data && Array.isArray(data)) {
      //     data.forEach(i => {
      //       import(`file://${i.entry}`).then(main => {
      //         GlobalPluginManager.registerPlugin(main)
      //       })
      //     })
      //   }
      // })
    }
  }, [setting.general.userFilePath])
  useEffect(() => {
    ipcInstance.send('minimizeToTray', setting.general.minimizeToTray)
  }, [setting.general.minimizeToTray])

  useEffect(() => {
    ipcInstance.on('openObject', data => {
      if (data.url) {
        console.log(data.url)
        Rendevoz.Actions.Open.openRendevozLink(data.url)
      }
    })
    if (loginState.autoLogin && loginState.password && !autoLogined) {
      LoginService.loadUserDetailsFromCache()
        .then(i => {
          if (i) {
            setUser(i)
          }
        })
        .catch(e => {
          const email = localStorage.getItem('email')
          if (email) {
            LoginService.login(email, loginState.password)
              .then(data => {
                LoginService.getUserDetails(email, data.data.token)
                  .then(user => {
                    localStorage.setItem('email', user.data.email || '')
                    setUser({ ...user.data, password: loginState.password })
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
        })
    }

    initializeApp().then(() => {
      setTimeout(() => {
        postMessage({ payload: 'removeLoading' }, '*')
        setIntialized(true)
      }, 500)
    })

    ipcInstance.send('getUpdateDetails').then(res => {
      console.log(res)
      globalStore.set(updateInfoAtom, {
        version: res.data.version
      })
    })

    if (import.meta.env.PROD) {
      console.log = (function (origin) {
        return function () {}
      })(console.log)
    }
    return () => {
      ipcInstance.off('close')
      ipcInstance.off('openObject')
    }
  }, [])
  return null
}

export default Initializer
