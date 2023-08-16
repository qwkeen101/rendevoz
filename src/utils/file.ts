import { ipcInstance } from '@/plugins'
import Id from './id'
import { getSetting } from '@/core'

export const saveFileLocally = (filePath: string, fileName: string) => {
  const setting = getSetting()
  console.log(filePath, setting)
  if (setting.general.copyFileWhenImport) {
    return ipcInstance.send('saveFile', filePath, fileName)
  } else {
    return new Promise(res => {
      res({
        data: `file://${filePath}`
      })
    })
  }
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

export const deleteRendefile = (url: string) => {
  ipcInstance.send('deleteRendefile', url)
}
