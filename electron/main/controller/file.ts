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
callback('stat', async (p: string) => {
  return await FileService.stat(p)
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

callback('writeFile', async (...args: Parameters<typeof FileService.writeFile>) => {
  return await FileService.writeFile(...args)
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
callback('readFile', async filePath => {
  return await FileService.readFile(filePath)
})
callback('utimes', async p => {
  FileService.utimes(p)
})
callback('getUserFilePath', async () => {
  return DefaultRendevozDataPath
})
callback('changeToNewFilePath', async (curr: string) => {
  const originalAppPath =
    process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Preferences' : process.env.HOME + '/.local/share')
  console.log(originalAppPath, curr)
  if (
    path.relative(path.resolve(originalAppPath, 'rendevoz'), curr) === '' ||
    path.relative(path.resolve(originalAppPath, 'Rendevoz'), curr) === ''
  ) {
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
    fs.mkdirSync(targetFilesPath)
  }
  if (!fs.existsSync(targetImgsPath)) {
    fs.mkdirSync(targetImgsPath)
  }
  if (!fs.existsSync(targetBackupPath)) {
    fs.mkdirSync(targetBackupPath)
  }
  process.env.FILE_PATH = newPath
})
