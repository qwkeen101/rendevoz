import SyncAPI from '@/api/sync'
import exportData from '@/api/common/exportData'
import GlobalStates from '@/api/global/states'
import initializeApp from '@/api/lifycycle/initializeApp'
import indexData from '@/api/lifycycle/indexData'
import postProcess from '@/api/lifycycle/postProcess'
import toast from 'react-hot-toast'
import { globalStore } from '@/api/stores'
import { syncDB } from '@/utils'
import { getSetting } from '@/core'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async (method: 'pull' | 'push') => {
  const client = SyncAPI.cloudClient()
  if (client) {
    await SyncAPI.file.syncLocalFiles()
    if (method === 'pull') {
      GlobalStates.setState('initialized', false)
      try {
        GlobalStates.setState('loading', s => ({ ...s, currentState: 'loading remote data' }))
        const prevSetting = getSetting()
        await SyncAPI.restoreFromDB()
        await KeyvalueStore.updateOne('userSetting', { ...(await KeyvalueStore.fetchOne('userSetting')), sync: prevSetting.sync })
        await initializeApp()
        await indexData(true)
        globalStore.set(SyncAPI.stateAtom, { ...globalStore.get(SyncAPI.stateAtom), lastSynced: Date.now() })
        syncDB.table('state').put(Date.now(), 'lastSynced')
        postProcess()
      } catch (e) {
        if (typeof e === 'string') {
          toast.error(e)
        } else {
          toast.error('Unknown error!')
        }
      } finally {
        GlobalStates.setState('initialized', true)
      }
    }
    if (method === 'push') {
      const data = await exportData()
      await client.uploadData('all-data.zip', data)
    }
  }
}
