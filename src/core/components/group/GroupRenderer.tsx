import { MetaGroupChild } from '~/typings'
import { Content } from '@/components'
import { memo, useRef } from 'react'
import TableBodyRenderer from '@/core/components/group/components/table/TableWrapper'
import GroupTableHeader from '@/core/components/group/components/table/headers/TableHeader'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import GalleryRenderer from '@/core/components/group/components/gallery/GalleryRenderer'
import ListRenderer from '@/core/components/group/components/list/ListRenderer'

export const GroupRenderer = memo(() => {
  const displayValues = useSelectAtomValue(GroupStateAtom, s => s.viewValues)
  const filterValues = useSelectAtomValue(GroupStateAtom, s => s.filterValues)
  const containerRef = useRef<HTMLDivElement>(null)
  const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)

  return (
    <Content role={'renderer-container'} ref={containerRef} flex column fullHeight style={{ minWidth: 'fit-content', width: '100%' }}>
      {currentView === 'table' && <TableRenderer value={filterValues || displayValues} />}
      {currentView === 'gallery' && <GalleryRenderer value={filterValues || displayValues} />}
      {currentView === 'list' && <ListRenderer value={filterValues || displayValues} />}
    </Content>
  )
})

const TableRenderer = memo(({ value }: { value?: MetaGroupChild[] }) => {
  const currentViewId = useSelectAtomValue(GroupStateAtom, s => s.currentView?.id)
  const columns = useSelectAtomValue(GroupStateAtom, s => s.headerColumn)
  return (
    <Content flex column style={{ height: 0, flex: 1, padding: '0px 60px', width: '100%', '--table-columns': columns }}>
      <Content style={{ width: '100%', height: 'auto', marginBottom: 68 }}>
        <GroupTableHeader key={currentViewId} />
        <TableBodyRenderer value={value} />
      </Content>
    </Content>
  )
})
