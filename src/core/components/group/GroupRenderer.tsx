import { MetaGroupChild } from '~/typings'
import { Content } from '@/components'
import { memo, useRef } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import GalleryRenderer from '@/core/components/group/components/gallery/GalleryRenderer'
import ListRenderer from '@/core/components/group/components/list/ListRenderer'
import GroupGrouperRenderer from '@/core/components/group/components/grouper/multipleGroupRenderer'
import TableRenderer from '@/core/components/group/components/table/TableRenderer'
import KanbanRenderer from '@/core/components/group/components/kanban/KanbanRenderer'
import CalendarRenderer from '@/core/components/group/components/calendar/CalendarRenderer'

export const GroupRenderer = memo(() => {
  const displayValues = useSelectAtomValue(GroupStateAtom, s => s.viewValues)
  const filterValues = useSelectAtomValue(GroupStateAtom, s => s.filterValues)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  const hasGroup = useSelectAtomValue(GroupStateAtom, s => s.groups !== undefined)
  return (
    <Content role={'renderer-container'} ref={containerRef} flex column fullHeight style={{ minWidth: 'fit-content', width: '100%' }}>
      {hasGroup ? (
        <GroupGrouperRenderer />
      ) : (
        <>
          {currentView === 'table' && <TableRenderer value={filterValues || displayValues} />}
          {currentView === 'gallery' && <GalleryRenderer value={filterValues || displayValues} />}
          {currentView === 'list' && <ListRenderer value={filterValues || displayValues} />}
          {currentView === 'kanban' && <KanbanRenderer />}
        </>
      )}
    </Content>
  )
})
