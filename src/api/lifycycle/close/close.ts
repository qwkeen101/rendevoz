import SearchHelper from '@/api/textSearch/SearchHelper'
import backup from '@/api/lifycycle/close/backup'
import { ipcInstance } from '@/electron'

ipcInstance.on('unload', () => {
  close()
})

const close = async () => {
  console.log('closing')
  ipcInstance.send('hide')
  try {
    await SearchHelper.saveSearchIndexLocally()
    await backup()
  } finally {
    console.log('zzz')
    ipcInstance.send('close')
  }
}

export default close
