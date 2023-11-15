import FileSystemAdapter from '@/api/fileSystem/adapter'
import { deleteFileLocally, saveFileLocally, saveImageLocally, fetchRemoteImageAndSaveLocally } from './services'

const FileSystem = {
  fs: FileSystemAdapter(),
  saveImage: saveImageLocally,
  copyFile: saveFileLocally,
  deleteFile: deleteFileLocally,
  fetchRemoteImageAndSaveLocally
}

export default FileSystem
