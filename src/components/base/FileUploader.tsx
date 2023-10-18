import { useToggle } from '@/hooks'
import ClassName from '@/styles/classNames'
import { CSSProperties, ReactNode, useRef } from 'react'
import toast from 'react-hot-toast'
import { Content, Icon } from '.'
import { Button } from './button'
import useFileUpload from './useFileUpload'
import Colors from '@/consts/colors'
import { useTranslation } from 'react-i18next'

const FileUploader = ({
  onFileUploaded,
  dashed = false,
  text,
  showButton = true,
  accept,
  icon,
  style
}: {
  onFileUploaded?: (file: File) => void
  accept?: string
  dashed?: boolean
  text?: string | null
  showButton?: boolean
  icon?: string | ReactNode
  style?: CSSProperties
}) => {
  const [dragHighlight, toggleDragHighlight] = useToggle(false)
  const fileRef = useRef<File>()
  const { upload, renderUploader } = useFileUpload(onFileUploaded, accept)
  const { t } = useTranslation()
  return (
    <>
      <Content
        flex
        column
        centered
        gap={14}
        onDragEnter={e => {
          e.preventDefault()
        }}
        onDragOver={e => {
          console.log(e)
          e.preventDefault()
          toggleDragHighlight(true)
        }}
        onClick={() => {
          if (showButton) return
          upload()
        }}
        onDrop={e => {
          e.preventDefault()
          const data = e.dataTransfer
          const files = data.files
          const file = files[0]
          if (file) {
            fileRef.current = file
            onFileUploaded?.(file)
          } else {
            toast.error('Not Allowed File')
          }
          toggleDragHighlight(false)
        }}
        onDragLeave={e => {
          e.preventDefault()
          e.currentTarget === e.target && toggleDragHighlight(false)
        }}
        style={{
          border: `1px solid ${Colors.Background.Border}`,
          padding: 18,
          borderRadius: 8,
          borderColor: dragHighlight ? Colors.Font.Primary : Colors.Background.Border,
          borderStyle: dashed ? 'dashed' : 'solid',
          transition: 'all 0.3s ease',
          cursor: showButton ? undefined : 'pointer',
          ...style
        }}
      >
        {typeof icon === 'string' ? <Icon name={icon || 'park-file-addition-one'} size={36} /> : icon}
        {showButton && (
          <Button onClick={upload} style={{ padding: '6px 16px', whiteSpace: 'nowrap' }}>
            {t('general.select one file')}
          </Button>
        )}
        {renderUploader()}
      </Content>
    </>
  )
}

export default FileUploader
