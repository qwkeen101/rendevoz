import { contextBridge, ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('ipcRenderer', {
  on: (c, h) => ipcRenderer.on(c, h),
  invoke: (c, ...args) => ipcRenderer.invoke(c, ...args),
  removeAllListeners: c => ipcRenderer.removeAllListeners(c)
})
