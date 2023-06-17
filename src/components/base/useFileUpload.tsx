import Id from '@/utils/id'
import { useRef } from 'react'

const useFileUpload = (onUpload?: (file: File) => void, accept?: string) => {
  const id = Id.getStrId()
  const labelRef = useRef<HTMLLabelElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const upload = () => {
    labelRef.current?.click()
  }
  const removeFile = () => {
    inputRef.current && (inputRef.current.value = '')
  }
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
          onChange={e => {
            e.target.files
            const file = e.target.files?.[0]
            if (file) {
              onUpload?.(file)
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
