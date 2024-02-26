import { memo, useState } from 'react'
import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { Modal } from '@/components'

const GlobalMediaPreviewer = memo(() => {
  const [previewState, setPreviewState] = useState<{
    visible: boolean
    path?: string
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    commonOps: {
      ...GlobalInstance.commonOps,
      previewMedia: path => {
        setPreviewState({
          visible: true,
          path
        })
      }
    }
  })
  return (
    <Modal visible={previewState.visible} onClose={() => setPreviewState({ visible: false })}>
      {previewState.path && <video controls style={{ width: '70vw', display: 'block' }} src={previewState.path} />}
    </Modal>
  )
})

export default GlobalMediaPreviewer
