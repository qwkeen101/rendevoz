import Id from '@/utils/id'
import { useEffect, useRef } from 'react'

const useFileUpload = (
  onUpload?: (file: File | undefined) => void,
  accept?: string,
  options?: {
    multiple?: boolean
    dir?: boolean
    onCancel?: VoidFunction
  }
) => {
  const id = Id.getStrId()
  const labelRef = useRef<HTMLLabelElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = () => {
    labelRef.current?.click()
  }
  const removeFile = () => {
    inputRef.current && (inputRef.current.value = '')
  }
  useEffect(() => {
    if (options?.onCancel && inputRef.current) {
      inputRef.current.addEventListener('cancel', options?.onCancel)
      return () => {
        inputRef.current?.removeEventListener('cancel', options?.onCancel)
      }
    }
  })
  const renderUploader = () => {
    return (
      <>
        <input
          style={{ display: 'none' }}
          type="file"
          id={id}
          name={id}
          ref={inputRef}
          accept={accept}
          webkitdirectory={options?.dir ? 'true' : undefined}
          multiple={options?.multiple}
          onChange={e => {
            if (options?.dir) {
              onUpload?.(Array.from(e.target.files))
              return
            }
            if (options?.multiple) {
              onUpload?.(Array.from(e.target.files))
            } else {
              const file = e.target.files?.[0]
              if (file) {
                onUpload?.(file)
              } else {
                options?.onCancel?.()
              }
            }
          }}
        />
        <label htmlFor={id} ref={labelRef} style={{ display: 'none' }}></label>
      </>
    )
  }
  return {
    renderUploader,
    upload,
    removeFile
  }
}

export default useFileUpload
