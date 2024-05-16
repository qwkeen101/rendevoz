export type ISystemFile = {
  // create time
  ctime: number
  // modify time
  mtime: number
  name: string
  size: number
}

export type IFileSystem = {
  stat: (path: string) => Promise<ISystemFile | undefined>
  getLatestBackup: (lastUpdated?: string) => Promise<string>
  readFile: (filePath: string) => Promise<string | Uint8Array | undefined>
  /**
   * @return the uri where the file was written into
   */
  writeFile: (data: string | Blob | Uint8Array, path: string) => Promise<string>
  deleteFile: (path: string) => Promise<void>
  getMachineId: () => Promise<string>
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
