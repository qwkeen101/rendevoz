import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { memo, useState } from 'react'
import { Modal } from '@/components'
import QuickAddForm from '@/components/form/quickAdd/QuickAddForm'

export default memo(() => {
  const [quickAddState, setQuickAddState] = useState<{
    visible: boolean
    metaId?: number[]
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      quickAdd: metaId => {
        const idArr = Array.isArray(metaId) ? metaId : [metaId]
        setQuickAddState({
          visible: true,
          metaId: idArr
        })
      }
    }
  })

  return (
    <Modal
      zIndex={8000}
      visible={quickAddState.visible}
      onClose={() => {
        setQuickAddState(s => ({ ...s, visible: false }))
      }}
      enableClickEvent={true}
    >
      {quickAddState.metaId && (
        <QuickAddForm onClose={() => setQuickAddState(s => ({ ...s, visible: false }))} currentMetaId={quickAddState.metaId} />
      )}
    </Modal>
  )
})
