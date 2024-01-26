import useGroupState, { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { useEffect, useMemo } from 'react'
import { atom, useAtom } from 'jotai'
import { selectAtom } from 'jotai/utils'

export default () => {
  const instance = useGroupInstance()
  const subAtom = useMemo(() => {
    const valuesAtom = selectAtom(GroupStateAtom, s => s.data?.values)
    const valueIndexAtom = selectAtom(GroupStateAtom, s => s.currentView?.valueIndex)
    return atom(get => {
      const values = get(valuesAtom)
      const valueIndex = get(valueIndexAtom)
      const groupState = instance.getGroupState?.()
      if (!valueIndex || !values || !groupState) return
      if (valueIndex.length !== values.length) {
        const valuesIdSet = new Set(values.map(i => i.rowId))
        const afterFilterIndex = valueIndex.filter(i => valuesIdSet.has(i))
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
  useAtom(subAtom)
}
