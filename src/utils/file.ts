import { ipcInstance } from '@/plugins'

export const saveFileLocally = (filePath: string, fileName: string) => {
  return ipcInstance.send('saveFile', filePath, fileName)
}
