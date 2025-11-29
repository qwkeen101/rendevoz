import { assignProperties } from '@/utils'
import { memo, useState } from 'react'
import { Modal } from '@/components'
import QuickAddForm, { AvailableQuickAdd } from '@/components/form/quickAdd/QuickAddForm'
import { Zindexes } from '@/consts'

export default memo(() => {
  const [quickAddState, setQuickAddState] = useState<{
    visible: boolean
    metaId?: number[]
    defaultVisible?: AvailableQuickAdd
  }>({
    visible: false
  })
  assignProperties(Global, {
    metaOps: {
      ...Global.metaOps,
      quickAdd: (metaId, target) => {
        Global.metaOps.closeDetails?.()
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
    <>
      <Modal
        zIndex={quickAddState.defaultVisible === 'tags' ? Zindexes.QuickAddTag : Zindexes.QuickAdd}
        visible={quickAddState.visible}
        onClose={() => {
          setQuickAddState(s => ({ ...s, visible: false, defaultVisible: undefined }))
        }}
      >
        {quickAddState.metaId && (
          <QuickAddForm
            defaultVisible={quickAddState.defaultVisible}
            onClose={() => setQuickAddState(s => ({ ...s, visible: false, defaultVisible: undefined }))}
            currentMetaId={quickAddState.metaId}
          />
        )}
      </Modal>
    </>
  )
})
