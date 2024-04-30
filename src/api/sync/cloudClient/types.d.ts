export type ICloudSyncClient = {
  deleteFile: (filePath: string) => Promise<void>
  // return string data
  getFile: (filePath: string) => Promise<string | undefined>
  listFolder: (dirName: string, startAfter?: string) => Promise<{ key: string; lastModified?: number; size?: number }[]>
  uploadData: (filePath: string, data: string | Blob) => Promise<void>
  downloadFile: (
    filePath: string | string[],
    opts?: {
      onProgress?: (type: 'finish' | 'start', path: string, size?: number) => void
    }
  ) => Promise<void>
  getFileAsBuffer: (filePath: string) => Promise<ArrayBuffer | undefined>
  uploadFile: (
    filePath: string | string[],
    opts?: {
      onProgress?: (type: 'finish' | 'start', path: string, size?: number) => void
      skipSetting?: boolean
    }
  ) => Promise<void>
}
