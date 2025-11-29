import useFileUpload from '@/components/base/useFileUpload'
import { assignProperties } from '@/utils'
import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const GlobalUtils = () => {
  const currentUploadPromiseRef = useRef<any>()
  const [uploadOptions, setUploadOptions] = useState()
  const { removeFile, renderUploader, upload } = useFileUpload(
    files => {
      if (currentUploadPromiseRef.current) {
        currentUploadPromiseRef.current(files)
        currentUploadPromiseRef.current = undefined
        removeFile()
        setUploadOptions(undefined)
      }
    },
    uploadOptions?.accept,
    {
      multiple: uploadOptions?.multiple,
      dir: uploadOptions?.dir,
      onCancel: () => {
        setUploadOptions(undefined)
        removeFile()
      }
    }
  )
  assignProperties(Global, {
    commonOps: {
      ...Global.commonOps,
      upload: opts => {
        return new Promise(res => {
          setUploadOptions(opts || {})
          setTimeout(() => upload())
          currentUploadPromiseRef.current = res
        })
      }
    }
  })
  if (uploadOptions) {
    return createPortal(<>{renderUploader()}</>, document.body)
  }
}

export default GlobalUtils
