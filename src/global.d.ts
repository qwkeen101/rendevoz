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

declare module 'react' {
  interface CSSProperties {
    // For inline css variables
    [key: `--${string}`]: string | number | undefined
  }
}

declare module '*.json5' {
  const src: string
  export default src
}
