import { saveFileLocally, saveImageLocally } from './services'
import electron from './electron'

const FileSystem = {
  fs: electron,
  saveImage: saveImageLocally,
  copyFile: saveFileLocally
}

export default FileSystem
