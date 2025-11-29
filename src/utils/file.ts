import { ipcInstance } from '@/electron'

type IFileType = 'video' | 'audio' | 'pdf' | 'image'
const fileTypes: Record<IFileType, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff', 'webp', 'ico', 'svg'],
  video: ['mp4', 'avi', 'mov', 'mkv', 'flv', 'wmv', 'webm', 'mpeg'],
  audio: ['mp3', 'wav', 'aac', 'flac', 'ogg', 'wma', 'm4a', 'aiff', 'amr'],
  pdf: ['pdf']
}

export const getFilenameWithoutExtension = (name: string) => {
  const availableFileExts = Object.values(fileTypes).flat()
  const fileName = decodeURIComponent(name)
  if (fileName.includes('.')) {
    const extension = fileName.split('.').pop() || ''
    if (availableFileExts.includes(extension)) return fileName.substr(0, fileName.lastIndexOf('.'))
    return fileName
  }
  return fileName
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
