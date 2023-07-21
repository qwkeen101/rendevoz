import { GlobalUtilsInstance } from '../global/GlobalUtils'
import { IRendevoz } from '~/typings'
import { saveBlobLocally, saveImageLocally } from '@/utils'

const uploadFile = (): Promise<File[]> => {
  return new Promise(res => {
    GlobalUtilsInstance.upload?.().then(files => res(files))
  })
}

const Utils: IRendevoz['Actions']['Utils'] = {
  uploadFile,
  saveFile: (...args) => saveBlobLocally(...args),
  saveImage: (...args) => saveImageLocally(...args)
}

export default Utils
