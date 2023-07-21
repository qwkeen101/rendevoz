import { ipcInstance } from '@/plugins'
import Id from './id'

export const saveFileLocally = (filePath: string, fileName: string) => {
  return ipcInstance.send('saveFile', filePath, fileName)
}

export const saveBlobLocally = async (
  blob: Blob,
  name = Id.getStrId(),
  path?: string,
  savePath?: 'files' | 'imgs' | 'backup'
): Promise<string | undefined> => {
  const arrBuff = await blob.arrayBuffer()
  const res = await ipcInstance.send('saveBuffer', arrBuff, name, path, savePath)
  return res.data
}

export const getFilenameWithoutExtension = (name: string) => {
  return name.substr(0, name.lastIndexOf('.'))
}

export const getDefaultUserFilePath = async (): Promise<string> => {
  const result = await ipcInstance.send('getUserFilePath')
  return result.data
}

export const getSelectedFolderPath = async (): Promise<string> => {
  const result = await ipcInstance.send('getSelectedFolderPath')
  return result.data
}

export const changeFilePath = async (newPath: string) => {
  ipcInstance.send('changeFilePath', newPath)
}

export const openDatabaseFolder = () => {
  ipcInstance.send('openDatabaseFolder')
}
