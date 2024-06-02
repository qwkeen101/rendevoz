export type ICloudSyncClient = {
  deleteFile: (filePath: string | string[]) => Promise<void>
  // return string data
  getFile: (filePath: string) => Promise<string | undefined>
  queueFiles: (filePath: string[], type: 'download' | 'upload') => Promise<void>
  listFolder: (dirName: string, startAfter?: string) => Promise<{ key: string; lastModified?: number; size?: number }[]>
  uploadData: (filePath: string, data: string | Blob) => Promise<void>
  downloadFile: (
    filePath: string | string[],
    opts?: {
      onProgress?: (type: 'finish' | 'start' | 'error', path: string, size?: number) => void
    }
  ) => Promise<void>
  cancelAllTasks: VoidFunction
  statFile: (filePath: string) => Promise<{ size?: number; lastModified?: number } | undefined>
  getFileAsBuffer: (filePath: string) => Promise<ArrayBuffer | undefined>
  uploadFile: (
    filePath: string | string[],
    opts?: {
      onProgress?: (type: 'finish' | 'start' | 'skipped' | 'error', path: string, size?: number) => void
      skipSetting?: boolean
    }
  ) => Promise<void>
  isConnected: () => Promise<boolean>
}
