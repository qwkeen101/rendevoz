import SearchHelper from '@/textSearch/SearchHelper'
import backup from '@/lifycycle/close/backup'
import { ipcInstance } from '@/plugins'

ipcInstance.on('unload', () => {
  close()
})

const close = async () => {
  await SearchHelper.saveSearchIndexLocally()
  await backup()
  ipcInstance.send('close')
}

export default close
