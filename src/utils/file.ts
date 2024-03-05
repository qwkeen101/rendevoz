import { ipcInstance } from '@/electron'
import FileSystem from '@/api/fileSystem'

export const saveFileLocally = (...args) => FileSystem.copyFile(...args)

export const getFilenameWithoutExtension = (name: string) => {
  return name.substr(0, name.lastIndexOf('.'))
}

export const getDefaultUserFilePath = async (): Promise<string> => {
  const result = await ipcInstance.send('getUserFilePath')
  return result.data
}

export const shouldChangeToNewDefaultUserFilePath = async (curr: string): Promise<boolean> => {
  return await ipcInstance.send('changeToNewFilePath', curr).then(i => i.data)
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
