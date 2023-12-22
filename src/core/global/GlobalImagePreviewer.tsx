import { Modal } from '@/components'
import { Zindexes } from '@/consts'
import createPanZoom from 'panzoom'
import { useEffect, useRef, useState } from 'react'

export const GlobalImagePreviewerInstance: {
  open?: (imgSrc: string) => void
} = {}

const GlobalImagePreviewer = () => {
  const [previewerState, setPreviewerState] = useState<{
    visible: boolean
    imgSrc?: string
  }>({
    visible: false
  })
  const imgRef = useRef<HTMLImageElement>(null)
  const { visible, imgSrc } = previewerState
  useEffect(() => {
    const img = imgRef.current
    if (img && visible) {
      const panzoom = createPanZoom(img)
      return () => {
        panzoom.dispose()
      }
    }
  }, [visible])
  GlobalImagePreviewerInstance.open = src => setPreviewerState({ imgSrc: src, visible: true })
  return (
    <Modal
      showClose
      visible={visible}
      onClose={() => setPreviewerState(s => ({ ...s, visible: false }))}
      hideBackground
      zIndex={Zindexes.ImagePreview}
    >
      <img
        ref={imgRef}
        src={imgSrc}
        style={{
          maxHeight: '80vh'
        }}
      />
    </Modal>
  )
}

export default GlobalImagePreviewer
