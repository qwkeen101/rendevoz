import useGroupState from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect } from 'react'

export default () => {
  const [groupState, setGroupState] = useGroupState()
  const instance = useGroupInstance()

  useEffect(() => {
    if (groupState.data?.values && groupState.currentView) {
      const latestGroupState = instance.getGroupState?.()
      const currentViewIndex = latestGroupState?.data?.views.find(i => i.id === groupState.currentView?.id)?.valueIndex
      console.log(currentViewIndex)
      if (!currentViewIndex) return
      const values = latestGroupState?.data?.values
      if (!values) return
      if (currentViewIndex.length !== values.length) {
        console.log('trigging')
        const valuesIdSet = new Set(values.map(i => i.rowId))
        const afterFilterIndex = currentViewIndex.filter(i => valuesIdSet.has(i))
        const afterFilterIndexSet = new Set([...afterFilterIndex])
        const newValues = values.filter(i => !afterFilterIndexSet.has(i.rowId))
        const newIndex =
          groupState.data.autoAddto === 'first'
            ? [...newValues.map(i => i.rowId), ...Array.from(afterFilterIndexSet.values())]
            : [...Array.from(afterFilterIndexSet.values()), ...newValues.map(i => i.rowId)]
        instance.updateCurrentView?.(s => ({ ...s, valueIndex: newIndex }))
      }
    }
  }, [groupState.data?.values, groupState.currentView])
}
