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
  readFile: async path => {
    return await ipcInstance.send('readFile', path).then(res => res.data)
  },
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
  stat: async path => {
    return await ipcInstance.send('stat', path).then(res => res.data)
  },
  writeFile: async (data, path) => {
    let str = ''
    const b = data instanceof Blob ? data : new Blob([data])
    const reader = new FileReader()
    reader.readAsDataURL(b)
    str = await new Promise(res => {
      reader.onload = () => {
        res(reader.result)
      }
    })
    if (!str) return
    return await ipcInstance.send('writeFile', str.split(';base64,')[1], path, 'base64').then(res => res.data)
  }
} as IFileSystem
