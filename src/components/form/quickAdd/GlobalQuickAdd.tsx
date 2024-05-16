import { assignProperties } from '@/utils'
import { GlobalInstance } from '@/hooks'
import { memo, useState } from 'react'
import { Modal } from '@/components'
import QuickAddForm, { AvailableQuickAdd } from '@/components/form/quickAdd/QuickAddForm'

export default memo(() => {
  const [quickAddState, setQuickAddState] = useState<{
    visible: boolean
    metaId?: number[]
    defaultVisible?: AvailableQuickAdd
  }>({
    visible: false
  })
  assignProperties(GlobalInstance, {
    metaOps: {
      ...GlobalInstance.metaOps,
      quickAdd: (metaId, target) => {
        const idArr = Array.isArray(metaId) ? metaId : [metaId]
        setQuickAddState({
          visible: true,
          metaId: idArr,
          defaultVisible: target
        })
      }
    }
  })

  return (
    <Modal
      zIndex={8000}
      visible={quickAddState.visible}
      onClose={() => {
        setQuickAddState(s => ({ ...s, visible: false, defaultVisible: undefined }))
      }}
      enableClickEvent={true}
    >
      {quickAddState.metaId && (
        <QuickAddForm defaultVisible={quickAddState.defaultVisible} onClose={() => setQuickAddState(s => ({ ...s, visible: false, defaultVisible: undefined }))} currentMetaId={quickAddState.metaId} />
      )}
    </Modal>
  )
})
