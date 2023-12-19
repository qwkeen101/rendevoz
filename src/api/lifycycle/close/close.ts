import SearchHelper from '@/api/textSearch/SearchHelper'
import backup from '@/api/lifycycle/close/backup'
import { ipcInstance } from '@/plugins'

ipcInstance.on('unload', () => {
  close()
})

const close = async () => {
  ipcInstance.send('hide')
  try {
    await SearchHelper.saveSearchIndexLocally()
    await backup()
  } finally {
    ipcInstance.send('close')
  }
}

export default close
