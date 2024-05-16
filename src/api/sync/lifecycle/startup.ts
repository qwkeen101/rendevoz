import SyncAPI from '@/api/sync'
import '@/api/sync/autoSync'
import { globalStore } from '@/api/stores'
import { selectAtom } from 'jotai/utils'
import { getSetting, SettingAtom } from '@/core'
import { debounce, isEqual } from 'lodash'
import GlobalStates from '@/api/global/states'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { initializeFileSizeMap } from '@/api/sync/file/listNeedUpload'

export default async () => {
  try {
    await initializeFileSizeMap('files')
    await initializeFileSizeMap('imgs')
    const setting = await KeyvalueStore.fetchOne('userSetting')
    if (setting && setting.sync.enableSync && setting.sync.enableAutoSync && setting.sync.conflictResolved) {
      GlobalStates.setState('loading', s => ({ ...s, currentState: 'loading remote data' }))
      await SyncAPI.restoreFromDB()
      GlobalStates.setState('remoteDataFetched', true)
      SyncAPI.file.syncLocalFiles()
    }
  } catch (e) {
    console.error(e)
  } finally {
    const selectedAtom = selectAtom(SettingAtom, s => ({ s3: s.sync.S3Config, webdav: s.sync.webdavConfig }), isEqual)
    const runCheck = () => {
      const setSyncState = (updater: any) => {
        const curr = globalStore.get(SyncAPI.stateAtom)
        globalStore.set(SyncAPI.stateAtom, updater(curr))
      }
      const c = SyncAPI.cloudClient()
      if (!c) {
        setSyncState(s => ({ ...s, connection: 'wrong config' }))
        return
      }
      SyncAPI.cloudClient()
        ?.isConnected()
        .then(res => {
          setSyncState(s => ({ ...s, connection: res ? 'connected' : 'unconnected' }))
        })
    }
    runCheck()
    const debounced = debounce(runCheck, 200)
    setInterval(debounced, 5000)
    globalStore.sub(selectedAtom, debounced)
  }
}
