import { atom } from 'jotai'
import { useEffect } from 'react'
import { GlobalSetting } from '@/core'
import { ipcInstance } from '@/electron'
import LoginService from '../services/login.service'
import { globalStore } from '@/api/stores'
import '@/api/lifycycle/close/close'
import initializeApp from '@/api/lifycycle/startup/initialize'
import GlobalStates from '@/api/global/states'
import UserService from '@/api/services/user.service'
import { OFFICIAL_BACKEND_ENABLED } from '@/config/backend'
export const updateInfoAtom = atom<
  | {
      version: string
    }
  | undefined
>(undefined)

const Initializer = () => {
  const [setting] = GlobalSetting.useSetting()
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
        Global.layoutOps?.openDeekLink(data.url)
      }
    })
    // try login first, otherwise switch to offline mode
    if (OFFICIAL_BACKEND_ENABLED) {
      LoginService.loginWithRefreshToken()
        .then(() => {
          UserService.getUserDetails().finally(() => {
            UserService.autoLogined = true
          })
        })
        .catch(() => {
          LoginService.loadUserDetailsFromCache().then(i => {
            if (i) {
              UserService.updateLocalUserDetails(i)
            }
          })
        })
    }

    initializeApp().then(() => {
      setTimeout(() => {
        GlobalStates.setState('initialized', true)
      }, 1000)
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
