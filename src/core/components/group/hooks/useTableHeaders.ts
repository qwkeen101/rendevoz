import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useSetAtom } from 'jotai'
import { useLayoutEffect } from 'react'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

export default () => {
  const instance = useGroupInstance()
  const properties = instance.viewOps?.useViewProperties()
  const setGroupState = useSetAtom(GroupStateAtom)

  useLayoutEffect(() => {
    if (properties) {
      const visible = properties.filter(i => i.visible && i.width)
      setGroupState(s => ({
        ...s,
        visibleHeaders: visible,
        showOriginalText: visible.some(i => i.name === 'originalText'),
        headerColumn: visible.map(i => `${i.width! + 1}px`).join(' '),
        tableWidth: visible.reduce((prev, curr) => prev + curr.width!, 0) + 35
      }))
    }
  }, [properties])
}
