import useGroupState from '@/core/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import { useEffect } from 'react'
import { MetaStore } from '@/api/stores'

export default () => {
  const [groupState, setGroupState] = useGroupState()
  const instance = useGroupInstance()

  useEffect(() => {
    if (groupState.data?.values && groupState.currentView) {
      const currentViewIndex = groupState.data.views.find(i => i.id === groupState.currentView?.id)?.valueIndex
      if (!currentViewIndex) return
      const values = groupState.data.values

      if (currentViewIndex.length !== values.length) {
        const valuesIdSet = new Set(values.map(i => i.rowId))
        const afterFilterIndex = currentViewIndex.filter(i => valuesIdSet.has(i))
        const afterFilterIndexSet = new Set([...afterFilterIndex])
        const newValues = values.filter(i => !afterFilterIndexSet.has(i.rowId))
        const newIndex =
          groupState.data.autoAddto === 'first'
            ? [...newValues.map(i => i.rowId), ...afterFilterIndex]
            : [...afterFilterIndex, ...newValues.map(i => i.rowId)]
        instance.updateCurrentView?.(s => ({ ...s, valueIndex: newIndex }))
      }
    }
  }, [groupState.data?.values])
}
