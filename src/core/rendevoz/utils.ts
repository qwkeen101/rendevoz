import { GlobalUtilsInstance } from '../global/GlobalUtils'
import { IRendevoz } from '~/typings'

const uploadFile: IRendevoz['Actions']['Utils']['uploadFile'] = opts => {
  return new Promise(res => {
    GlobalUtilsInstance.upload?.(opts).then(files => res(files))
  })
}

const Utils: IRendevoz['Actions']['Utils'] = {
  uploadFile
}

export default Utils
