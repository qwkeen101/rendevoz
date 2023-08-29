import { GlobalUtilsInstance } from '../global/GlobalUtils'
import { IRendevoz } from '~/typings'
import { saveBlobLocally, saveImageLocally } from '@/utils'

const uploadFile: IRendevoz['Actions']['Utils']['uploadFile'] = opts => {
  return new Promise(res => {
    GlobalUtilsInstance.upload?.(opts).then(files => res(files))
  })
}

const Utils: IRendevoz['Actions']['Utils'] = {
  uploadFile,
  saveFile: (...args) => saveBlobLocally(...args),
  saveImage: (...args) => saveImageLocally(...args)
}

export default Utils
