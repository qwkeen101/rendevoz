import useFileUpload from '@/components/base/useFileUpload'
import { assignProperties } from '@/utils'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { IGlobalUtilsInstance } from '~/typings/globalInstances/utils'

export const GlobalUtilsInstance: Partial<IGlobalUtilsInstance> = {}

const GlobalUtils = () => {
  const currentUploadPromiseRef = useRef<any>()
  const { removeFile, renderUploader, upload } = useFileUpload(
    files => {
      if (currentUploadPromiseRef.current) {
        currentUploadPromiseRef.current(files)
        currentUploadPromiseRef.current = undefined
      }
    },
    undefined,
    {
      multiple: true
    }
  )
  assignProperties(GlobalUtilsInstance, {
    upload: () => {
      return new Promise(res => {
        upload()
        currentUploadPromiseRef.current = res
      })
    }
  })
  return createPortal(<>{renderUploader()}</>, document.body)
}

export default GlobalUtils
