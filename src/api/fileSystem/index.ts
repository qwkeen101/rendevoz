import { saveFile, saveFileLocally, saveImageLocally } from './services'
import electron from './electron'

const getPathForFile = (file: File): string | undefined => {
  try {
    if ('webUtils' in window) {
      return window.webUtils.getPathForFile(file) as string
    }
    return undefined
  } catch (e) {
    return undefined
  }
}
const FileSystem = {
  fs: electron,
  saveImage: saveImageLocally,
  copyFile: saveFileLocally,
  saveFile: saveFile,
  getPathForFile
}

export default FileSystem
