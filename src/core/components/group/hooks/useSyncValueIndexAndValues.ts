import useGroupState, { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect, useMemo } from 'react'
import { atom, useAtom, useSetAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { isEqual } from 'lodash'

export default () => {
  const instance = useGroupInstance()
  const setGroupState = useSetAtom(GroupStateAtom)
  const subCurrentViewAtom = useMemo(() => {
    const viewsAtom = selectAtom(GroupStateAtom, s => s.data?.views)
    return atom(get => {
      const dataViews = get(viewsAtom)
      const currentView = instance.getGroupState?.().currentView
      if (currentView && dataViews) {
        const targetView = dataViews.find(i => i.id === currentView.id)
        if (targetView && !isEqual(targetView, currentView)) {
          setGroupState(s => ({ ...s, currentView: targetView }))
        }
      }
    })
  }, [])
  const subAtom = useMemo(() => {
    const valuesAtom = selectAtom(GroupStateAtom, s => s.data?.values)
    const valueIndexAtom = selectAtom(GroupStateAtom, s => s.currentView?.valueIndex)
    return atom(get => {
      const values = get(valuesAtom)
      const finalIndex = get(valueIndexAtom)
      const groupState = instance.getGroupState?.()
      if (!finalIndex || !values || !groupState) return
      if (finalIndex.length !== values.length) {
        const valuesIdSet = new Set(values.map(i => i.rowId))
        const afterFilterIndex = finalIndex.filter(i => valuesIdSet.has(i))
        const afterFilterIndexSet = new Set([...afterFilterIndex])
        const newValues = values.filter(i => !afterFilterIndexSet.has(i.rowId))
        const newIndex =
          groupState.data?.autoAddto === 'first'
            ? [...newValues.map(i => i.rowId), ...Array.from(afterFilterIndexSet.values())]
            : [...Array.from(afterFilterIndexSet.values()), ...newValues.map(i => i.rowId)]
        instance.updateCurrentView?.(s => ({ ...s, valueIndex: newIndex }))
      }
    })
  }, [])
  useAtom(subCurrentViewAtom)
  useAtom(subAtom)
}
