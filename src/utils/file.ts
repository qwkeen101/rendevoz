import { ipcInstance } from '@/plugins'
import Id from './id'

export const saveFileLocally = (filePath: string, fileName: string) => {
  return ipcInstance.send('saveFile', filePath, fileName)
}

export const saveBlobLocally = (blob: Blob, name = Id.getStrId(), path?: string) => {
  return blob.arrayBuffer().then(arrbuf => {
    return ipcInstance.send('saveBuffer', arrbuf, name, path)
  })
}
