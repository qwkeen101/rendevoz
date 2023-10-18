import { getSetting } from '@/core'
import { getAppState, setAppState } from '@/core/rendevoz/appState'
import { exportRendevozDb, saveBlobLocally } from '@/utils'
import DateFormat from '../../utils/dateFormat'

const backup = async () => {
  const setting = getSetting()
  if (setting.general.autoBackup !== 'never') {
    const lastBackUp = getAppState().lastBackupDate
    const lastBackupDate = lastBackUp && new Date(lastBackUp)
    let shouldBackup = false
    const now = new Date(Date.now())
    switch (setting.general.autoBackup) {
      case 'every day': {
        now.setDate(now.getDate() - 1)
        break
      }
      case '3 days': {
        now.setDate(now.getDate() - 3)
        break
      }
      case 'one month': {
        now.setMonth(now.getMonth() - 1)
        break
      }
      case 'one week': {
        now.setDate(now.getDate() - 7)
        break
      }
      case 'whenClose': {
        shouldBackup = true
        break
      }
    }
    if (!lastBackupDate || now.getTime() > lastBackupDate.getTime()) {
      shouldBackup = true
    }
    if (shouldBackup) {
      console.log('yes')
      const blob = await exportRendevozDb()
      await saveBlobLocally(blob, `rendevoz_data_backup_${DateFormat.format(Date.now(), 'Y_M_d_H_mm')}.json`, undefined, 'backup')
      setAppState({
        lastBackupDate: Date.now()
      })
    }
  }
}

export default backup
