import { Content } from '@/components'
import Modal from '@/components/base/Modal'
import { useToggle } from '@/hooks'
import { useEffect } from 'react'
import { InnerLabelProps } from './Label'

const ImageLabel = ({ url, onTitleChange }: InnerLabelProps) => {
  const [imageModalVisible, toggleImageModalVisible] = useToggle(false)
  useEffect(() => {
    onTitleChange?.('Image')
  }, [])
  return (
    <>
      <Modal width="80vw" height="80vh" visible={imageModalVisible} onClose={toggleImageModalVisible}>
        <Content fullHeight fullWidth flex centered style={{ padding: 20, overflowY: 'auto' }}>
          <img width="auto" style={{ maxWidth: '100%', borderRadius: 8 }} height="auto" src={url} />
        </Content>
      </Modal>
      <img style={{ borderRadius: 4 }} onClick={toggleImageModalVisible} src={url} width="100%" />
    </>
  )
}

export default ImageLabel
