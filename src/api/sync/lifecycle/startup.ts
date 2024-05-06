import SyncAPI from '@/api/sync'
import '@/api/sync/autoSync'
import { globalStore } from '@/api/stores'
import { selectAtom } from 'jotai/utils'
import { SettingAtom } from '@/core'
import { debounce, isEqual } from 'lodash'

export default async () => {
  try {
    await SyncAPI.restoreFromDB()
    await SyncAPI.file.syncLocalFiles()
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
