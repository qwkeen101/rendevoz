export type ISystemFile = {
  // create time
  cTime: number
  // modify time
  mTime: number
  name: string
  size: number
}

export type IFileSystem = {
  getLatestBackup: (lastUpdated?: string) => Promise<string>
  readFile: (filePath: string) => Promise<string>
  /**
   * @return the uri where the file was written into
   */
  writeFile: (data: string | Blob, path: string, type?: 'base64' | 'utf8' | 'binary') => Promise<string>
  deleteFile: (path: string) => Promise<void>
  readdir: (path: string) => Promise<{
    dirState: {
      totalSize: number
    }
    files: ISystemFile[]
  }>
  openFile: (path: string) => Promise<void>
  // popup dialog to select one dir, return dir absolute path
  selectDir: () => Promise<string>
  /**
   * @return the uri where the file was copied to
   */
  copyFile: (from: string, to: string) => Promise<string>
}
