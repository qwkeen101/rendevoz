import { Modal } from '@/components'
import { Zindexes } from '@/consts'
import createPanZoom from 'panzoom'
import { useEffect, useRef, useState } from 'react'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'

export default () => {
  const [previewerState, setPreviewerState] = useState<{
    visible: boolean
    imgSrc?: string
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      previewImage: url => {
        setPreviewerState({ imgSrc: url, visible: true })
      }
    }
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

  return (
    <Modal
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
