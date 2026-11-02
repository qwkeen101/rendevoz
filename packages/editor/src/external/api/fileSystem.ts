const FileSystem = {
  saveImage: async (_data: any) => Promise.resolve(typeof _data === 'string' ? _data : ''),
  upload: async (_file: File) => Promise.resolve(''),
  read: async (_path: string) => Promise.resolve('')
}

export default FileSystem
