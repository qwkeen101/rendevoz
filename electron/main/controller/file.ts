import callback from './callback'
import FileService, { DefaultRendevozDataPath } from '../service/file'
import path from 'path'
import { dialog } from 'electron'
import fs from 'fs'

callback('openLocalFile', async (filePath: string) => {
  return await FileService.openLocalFile(filePath)
})

callback('deleteLocalFile', async (filePath: string) => {
  return await FileService.deleteFile(filePath)
})

callback('deleteRendefile', async (filePath: string) => {
  return await FileService.deleteFile(filePath)
})

callback('deleteFile', async (filePath: string) => {
  return await FileService.deleteFile(filePath)
})

callback('copyFile', async (from: string, to: string) => {
  return await FileService.copyFile(from, to)
})

callback('saveBuffer', async (...args: Parameters<typeof FileService.saveBuffer>) => {
  return await FileService.saveBuffer(...args)
})

callback('writeFile', async (...args: Parameters<typeof FileService.writeFile>) => {
  return await FileService.writeFile(...args)
})

callback('saveFile', async (...args: Parameters<typeof FileService.saveFile>) => {
  return await FileService.saveFile(...args)
})

callback('saveImage', async (...args: Parameters<typeof FileService.saveImage>) => {
  return await FileService.saveImage(...args)
})

callback('openDatabaseFolder', async () => {
  const folderPath = FileService.getRendeFileFolderPath()
  const databasePath = path.join(folderPath, 'backup')
  await FileService.openFolder(databasePath)
  return
})

callback('readDir', async dirPath => {
  return await FileService.readDir(dirPath)
})
callback('getUserFilePath', async () => {
  return DefaultRendevozDataPath
})
callback('changeToNewFilePath', async (curr: string) => {
  const originalAppPath =
    process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')
  if (curr === originalAppPath) {
    return true
  }
  return false
})
callback('getSelectedFolderPath', async () => {
  const path = await dialog.showOpenDialog({
    properties: ['openDirectory', 'createDirectory']
  })
  return path.filePaths[0]
})

callback('changeFilePath', async (newPath: string) => {
  const targetFilesPath = path.join(newPath, 'files')
  const targetImgsPath = path.join(newPath, 'imgs')
  const targetBackupPath = path.join(newPath, 'backup')
  if (!fs.existsSync(targetFilesPath)) {
    fs.rename(path.join(FileService.getRendeFileFolderPath(), 'files'), path.join(newPath, 'files'), () => {})
  }
  if (!fs.existsSync(targetImgsPath)) {
    fs.rename(path.join(FileService.getRendeFileFolderPath(), 'imgs'), path.join(newPath, 'imgs'), () => {})
  }
  if (!fs.existsSync(targetBackupPath)) {
    fs.rename(path.join(FileService.getRendeFileFolderPath(), 'backup'), path.join(newPath, 'backup'), () => {})
  }
  process.env.FILE_PATH = newPath
})
