import useFileUpload from '@/components/base/useFileUpload'
import { assignProperties } from '@/utils'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IGlobalUtilsInstance } from '~/typings/globalInstances/utils'
import { IRendevoz } from '~/typings'

export const GlobalUtilsInstance: Partial<IGlobalUtilsInstance> = {}

const GlobalUtils = () => {
  const currentUploadPromiseRef = useRef<any>()
  const [uploadOptions, setUploadOptions] = useState<Parameters<IRendevoz['Actions']['Utils']['uploadFile']>[0]>()
  const { removeFile, renderUploader, upload } = useFileUpload(
    files => {
      if (currentUploadPromiseRef.current) {
        currentUploadPromiseRef.current(files)
        currentUploadPromiseRef.current = undefined
      }
    },
    uploadOptions?.accept,
    {
      multiple: uploadOptions?.multiple,
      dir: uploadOptions?.dir
    }
  )
  assignProperties(GlobalUtilsInstance, {
    upload: opts => {
      return new Promise(res => {
        setUploadOptions(opts)
        setTimeout(() => upload())
        currentUploadPromiseRef.current = res
      })
    }
  })
  return createPortal(<>{renderUploader()}</>, document.body)
}

export default GlobalUtils
