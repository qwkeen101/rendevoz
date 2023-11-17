import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useSetAtom } from 'jotai'
import { useLayoutEffect } from 'react'
import { useSelectAtomValue } from '@/hooks'

export default () => {
  const properties = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.properties)
  const setGroupState = useSetAtom(GroupStateAtom)

  useLayoutEffect(() => {
    if (properties) {
      const visible = properties.filter(i => i.visible)
      setGroupState(s => ({
        ...s,
        visibleHeaders: visible,
        headerColumn: visible.map(i => `${i.width + 1}px`).join(' '),
        tableWidth: visible.reduce((prev, curr) => prev + curr.width, 0) + 35
      }))
    }
  }, [properties])
}
