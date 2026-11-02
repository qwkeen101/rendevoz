import callback from './callback'
import { autoUpdater } from 'electron-updater'
import path from 'path'
import fs from 'fs'
import { machineId } from '../utils/getMachineId'

callback('getUpdateDetails', async () => {
  // null when not packaged (dev) or updates are disabled
  const result = await autoUpdater.checkForUpdates()
  return result?.updateInfo
})
callback('getMachineId', async () => {
  return await machineId(false)
})
callback('getLatestBackup', async (latestBackup?: string) => {
  let latestNum: undefined | number = undefined
  if (latestBackup) {
    const num = Number(latestBackup)
    if (!Number.isNaN(num)) {
      latestNum = num
    }
  }
  const userFilePath = process.env.FILE_PATH
  const backupPath = path.resolve(userFilePath, 'backup')
  const dir = fs.readdirSync(backupPath)
  if (dir) {
    const files = dir
      .map(i => {
        const p = path.resolve(userFilePath, 'backup', i)
        const stat = fs.statSync(p)
        if (stat.isFile()) return { ...stat, path: p }
      })
      .filter(i => i)
      .sort((a, b) => b.ctime.getTime() - a.ctime.getTime())
    const latest = files[0]
    if (latestNum) {
      if (latestNum > latest.ctime.getTime()) {
        return ''
      }
    }
    return fs.readFileSync(latest.path)
  }
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
