import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Content } from '@/components'

export default function GroupGrouperRenderer() {
  const instance = useGroupInstance()
  const currentViewType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  const currentGroupers = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const m = instance.getScrollMargin?.() ?? 0
  const virtualizer = useVirtualizer({
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 500,
    count: currentGroupers?.length ?? 0,
    scrollMargin: m
  })
  console.log(currentGroupers)
  return null
}
