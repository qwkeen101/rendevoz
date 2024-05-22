import SearchHelper from '@/api/textSearch/SearchHelper'
import backup from '@/api/lifycycle/close/backup'
import { ipcInstance } from '@/electron'
import { getSetting } from '@/core'
import SyncAPI from '@/api/sync'

ipcInstance.on('unload', () => {
  close()
})

const close = async () => {
  console.log('closing')
  ipcInstance.send('hide')
  try {
    await SearchHelper.saveSearchIndexLocally()
    await backup()
    const setting = getSetting()
    if (setting.sync.enableSync && setting.sync.conflictResolved && setting.sync.enableAutoSync) {
      await SyncAPI.commitLocalTransactions()
    }
  } finally {
    console.log('zzz')
    ipcInstance.send('close')
  }
}

export default close
