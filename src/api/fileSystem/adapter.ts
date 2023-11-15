import electron from '@/api/fileSystem/electron'

const FileSystemAdapter = () => {
  if (navigator.userAgent.indexOf('Electron') >= 0) {
    return electron
  }
  return electron
}

export default FileSystemAdapter
