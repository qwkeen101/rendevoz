import { GlobalUtilsInstance } from '../global/GlobalUtils'

const uploadFile = (): Promise<File[]> => {
  return new Promise(res => {
    GlobalUtilsInstance.upload?.().then(files => res(files))
  })
}

const Utils = {
  uploadFile
}

export default Utils
