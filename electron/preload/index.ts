import { contextBridge, ipcRenderer, webUtils } from 'electron'
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (c, h) => ipcRenderer.on(c, h),
  invoke: (c, ...args) => ipcRenderer.invoke(c, ...args),
  removeAllListeners: c => ipcRenderer.removeAllListeners(c)
})
contextBridge.exposeInMainWorld('webUtils', {
  getPathForFile: file => webUtils.getPathForFile(file)
})
