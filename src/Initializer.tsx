import { ProgressInfo } from 'electron-updater'
import produce from 'immer'
import { atom } from 'jotai'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'
import { useTranslation } from 'react-i18next'
import { loginStateAtom } from './components/Login'
import { getSetting, SettingAtom } from './core'
import { getAppState, setAppState } from './core/rendevoz/appState'
import { useGlobalAtom, useGlobalAtomValue, useGlobalSetAtom, useSelectGlobalAtomValue } from './hooks/jotai'
import { ipcInstance } from './plugins'
import LoginService, { userAtom } from './services/login.service'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './stores'
import DateFormat from './utils/dateFormat'
import { exportRendevozDb } from './utils/db'
import { changeFilePath, getDefaultUserFilePath, saveBlobLocally } from './utils/file'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalPluginManager } from '@/App'

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
  const autoBackup = useSelectGlobalAtomValue(SettingAtom, s => s.general.autoBackup)
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
    const unloadListener = (e: Event) => {
      const setting = getSetting()
      if (setting.general.autoBackup !== 'never') {
        const lastBackUp = getAppState().lastBackupDate
        const lastBackupDate = lastBackUp && new Date(lastBackUp)
        let shouldBackup = false
        const now = new Date(Date.now())
        switch (setting.general.autoBackup) {
          case 'every day': {
            now.setDate(now.getDate() - 1)
            break
          }
          case '3 days': {
            now.setDate(now.getDate() - 3)
            break
          }
          case 'one month': {
            now.setMonth(now.getMonth() - 1)
            break
          }
          case 'one week': {
            now.setDate(now.getDate() - 7)
            break
          }
          case 'whenClose': {
            shouldBackup = true
            break
          }
        }
        if (!lastBackupDate || now.getTime() > lastBackupDate.getTime()) {
          shouldBackup = true
        }
        if (shouldBackup) {
          ipcInstance.send('beginBackup')
          exportRendevozDb().then(blob => {
            saveBlobLocally(blob, `rendevoz_data_backup_${DateFormat.format(Date.now(), 'Y_M_d_H_mm')}.json`, undefined, 'backup').then(
              () => {
                setAppState({
                  lastBackupDate: Date.now()
                })
                ipcInstance.send('endBackup')
                setTimeout(() => {
                  window.close()
                }, 100)
              }
            )
          })
        } else {
          ipcInstance.send('endBackup')
          setTimeout(() => {
            window.close()
          }, 100)
        }
      }
    }

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
    ipcInstance.on('close', unloadListener)
    ipcInstance.on('openObject', data => {
      console.error(data)
      if (data.metaId) {
        Rendevoz.Actions.Open.Meta.openMetaObject(Number(data.metaId))
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
    Promise.all([getAllMetaLinks(), getAllMetaObjects(), getAllCollections(), ObjectStore('tag').getAll()]).then(() => {
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
    return () => {
      ipcInstance.off('close')
      ipcInstance.off('download')
      ipcInstance.off('openObject')
    }
  }, [])

  useEffect(() => {
    if (autoBackup !== 'never') {
      ipcInstance.send('beginBackup')
    } else {
      ipcInstance.send('endBackup')
    }
  }, [autoBackup])
  return null
}

export default Initializer
