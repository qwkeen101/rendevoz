import { ProgressInfo } from 'electron-updater'
import produce from 'immer'
import { atom } from 'jotai'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { loginStateAtom } from './components/Login'
import { SettingAtom } from './core'
import { useGlobalAtom, useGlobalAtomValue, useGlobalSetAtom } from '@/hooks'
import { ipcInstance } from './plugins'
import LoginService, { userAtom } from './services/login.service'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './stores'
import { changeFilePath, getDefaultUserFilePath } from '@/utils'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalPluginManager } from '@/App'
import initializeWorkspace from '@/lifycycle/startup/initializeWorkspace'
import '@/lifycycle/close/close'
export const initializedAtom = atom(false)
export const updateInfoAtom = atom<
  | {
      version: string
    }
  | undefined
>(undefined)
let autoLogined = false

const DownloadInfoAtom = atom<{
  beginDownload: boolean
  downloadProgress?: number
  downloadSpeed?: number
}>({
  beginDownload: false
})

const Initializer = () => {
  const [loginState] = useGlobalAtom(loginStateAtom)
  const [, setUser] = useGlobalAtom(userAtom)
  const { getAllMetaObjects, getAllMetaLinks } = MetaStore
  const { getAllCollections } = CollectionStore
  const setIntialized = useGlobalSetAtom(initializedAtom)
  const { t } = useTranslation()
  const setSetting = useGlobalSetAtom(SettingAtom)
  const setting = useGlobalAtomValue(SettingAtom)
  useEffect(() => {
    if (setting.general.userFilePath) {
      const pluginsFolder = `${setting.general.userFilePath}/plugins`
      ipcInstance.send('installPlugins', pluginsFolder).then(res => {
        const { data } = res
        if (data && Array.isArray(data)) {
          data.forEach(i => {
            import(`file://${i.entry}`).then(main => {
              GlobalPluginManager.registerPlugin(main)
            })
          })
        }
      })
    }
  }, [setting.general.userFilePath])
  const setDownloadInfo = useGlobalSetAtom(DownloadInfoAtom)
  useEffect(() => {
    const downloadListener = (e: ProgressInfo) => {
      console.log(e)
      setDownloadInfo(s => ({
        ...s,
        beginDownload: true,
        downloadProgress: e.percent,
        downloadSpeed: e.bytesPerSecond
      }))
    }
    ipcInstance.on('download', downloadListener)
    ipcInstance.on('openObject', data => {
      if (data.url) {
        Rendevoz.Actions.Open.openRendevozLink(data.url)
      }
    })
    if (loginState.autoLogin && loginState.password && !autoLogined) {
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
    }
    getDefaultUserFilePath().then(path => {
      setSetting(s =>
        produce(s, s => {
          if (s.general.language === undefined) {
            if (navigator.language.includes('zh')) {
              s.general.language = 'zh-CN'
            } else {
              s.general.language = 'en-US'
            }
            console.log(s.general.language)
          }
          s.general.defaultFilePath = path
          if (s.general.userFilePath === undefined) {
            s.general.userFilePath = path
            return
          }
          const pluginsFolder = `${s.general.userFilePath}/plugins`
          if (s.general.userFilePath !== path) {
            changeFilePath(s.general.userFilePath)
          }
        })
      )
    })
    initializeWorkspace(setSetting).then(() => {
      Promise.all([
        getAllMetaLinks(),
        getAllMetaObjects(),
        getAllCollections(),
        ObjectStore('tag').getAll(),
        ObjectStore('group').getAll()
      ]).then(() => {
        setIntialized(true)
      })
    })

    ipcInstance.send('getUpdateDetails').then(res => {
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
