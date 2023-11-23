import callback from './callback'
import { autoUpdater } from 'electron-updater'

callback('getUpdateDetails', async () => {
  const result = await autoUpdater.checkForUpdates()
  return result.updateInfo
})

callback('downloadApp', async () => {
  if (process.env.IS_DOWNLOADING === 'true') return
  autoUpdater.downloadUpdate()
  process.env.IS_DOWNLOADING = 'true'
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

callback('installApp', async () => {
  autoUpdater.quitAndInstall(true, true)
})
