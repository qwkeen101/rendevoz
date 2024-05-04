export {}
import 'i18next'

declare global {
  interface Window {
    // Expose some Api through preload script
    fs: typeof import('fs')
    ipcRenderer: import('electron').IpcRenderer
    removeLoading: () => void
  }
  interface Array<T> {
    findLastIndex(predicate: (value: T, index: number, obj: T[]) => boolean | undefined, thisArg?: any): number
    findLast(predicate: (value: T, index: number, obj: T[]) => boolean | undefined, thisArg?: any): T
  }
}
declare module 'i18next' {
  interface CustomTypeOptions {
    returnNull: false
  }
}

declare module 'react' {
  interface CSSProperties {
    appRegion?: string | undefined
    // For inline css variables
    [key: `--${string}`]: string | number | undefined
  }
}

declare module '*.json5' {
  const src: string
  export default src
}
