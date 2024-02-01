import FileSystem from '@/api/fileSystem'
import { importRendevozDb } from '@/utils'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export default async () => {
  const setting = await KeyvalueStore.fetchOne('userSetting')
  const lastUpdated = localStorage.getItem('DB_LAST_UPDATE')
  if (setting?.general.autoRecoverFromBackup) {
    const backup = await FileSystem.fs.getLatestBackup(lastUpdated)
    if (backup) {
      const blob = new Blob([backup])
      await importRendevozDb(blob)
      console.log('successfully import')
    }
  }
}
