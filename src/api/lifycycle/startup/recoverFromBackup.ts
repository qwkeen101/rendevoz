import FileSystem from '@/api/fileSystem'
import { importRendevozDb } from '@/utils'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import GlobalStates from '@/api/global/states'

export default async () => {
  try {
    const setting = await KeyvalueStore.fetchOne('userSetting')
    const lastUpdated = localStorage.getItem('DB_LAST_UPDATE')
    if (setting?.general.autoRecoverFromBackup) {
      const remoteDataFetched = GlobalStates.getValue('remoteDataFetched')
      if (remoteDataFetched) return
      GlobalStates.setState('loading', s => ({ ...s, currentState: 'recovering from backup' }))
      const backup = await FileSystem.fs.getLatestBackup(lastUpdated)
      if (backup) {
        const blob = new Blob([backup])
        await importRendevozDb(blob)
      }
    }
  } catch (e) {
    console.error(e)
  }
}
