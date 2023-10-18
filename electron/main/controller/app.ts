import callback from './callback'
import { autoUpdater } from 'electron-updater'

callback('getUpdateDetails', async () => {
  const result = await autoUpdater.checkForUpdatesAndNotify()
  return result.updateInfo
})

callback('updateAndInstall', async () => {
  try {
    process.env.USER_CALL_UPDATE = 'true'
    const result = await autoUpdater.downloadUpdate()
    return result
  } catch (e) {
    autoUpdater.quitAndInstall(true, true)
  }
})
