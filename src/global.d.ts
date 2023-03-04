export {}
import 'i18next'

declare global {
  interface Window {
    // Expose some Api through preload script
    fs: typeof import('fs')
    ipcRenderer: import('electron').IpcRenderer
    removeLoading: () => void
  }
}
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}
