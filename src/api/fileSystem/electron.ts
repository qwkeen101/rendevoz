import { IFileSystem } from '~/typings/fs'
import { ipcInstance } from '@/electron'

export default {
  getLatestBackup: async lastUpdated => {
    return await ipcInstance.send('getLatestBackup', lastUpdated).then(res => res?.data)
  },
  readdir: async path => {
    return await ipcInstance.send('readDir', path).then(res => res.data)
  },
  openFile: async path => {
    ipcInstance.send('openLocalFile', path)
  },
  readFile: path => {},
  selectDir: async () => {
    return ipcInstance.send('getSelectedFolderPath').then(res => res.data)
  },
  getMachineId: async () => {
    return await ipcInstance.send('getMachineId').then(i => i.data)
  },
  deleteFile: async path => {
    await ipcInstance.send('deleteFile', path)
    return
  },
  copyFile: async (from, to) => {
    return await ipcInstance.send('copyFile', from, to).then(res => res.data)
  },
  writeFile: async (data, path, type) => {
    let binaryData = data instanceof Blob ? await (type === 'binary' ? data.arrayBuffer() : data.text()) : data
    if (type === 'binary') {
      binaryData = new Uint8Array(binaryData)
    }
    return await ipcInstance.send('writeFile', binaryData, path, type).then(res => res.data)
  }
} as IFileSystem
