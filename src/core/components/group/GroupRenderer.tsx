import { MetaGroupChild } from '~/typings'
import { Content } from '@/components'
import { memo, useRef } from 'react'
import TableBodyRenderer from '@/core/components/group/components/table/TableWrapper'
import useGroupFilter from '@/core/components/group/hooks/useGroupFilter'
import GroupTableHeader from '@/core/components/group/components/table/headers/TableHeader'
import useTableHeaders from '@/core/components/group/hooks/useTableHeaders'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import GalleryRenderer from '@/core/components/group/components/gallery/GalleryRenderer'

export const GroupRenderer = memo(() => {
  const displayValues = useSelectAtomValue(GroupStateAtom, s => s.viewValues)
  const filterValues = useSelectAtomValue(GroupStateAtom, s => s.filterValues)
  const containerRef = useRef<HTMLDivElement>(null)
  // const currentView = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  useTableHeaders()

  return (
    <Content ref={containerRef} flex column fullHeight style={{ minWidth: 'fit-content', width: '100%' }}>
      {/*{currentView === 'table' && <TableRenderer value={filterValues || displayValues} />}*/}
      {/*{currentView === 'gallery' && <GalleryRenderer values={filterValues || displayValues} />}*/}
      <TableRenderer value={filterValues || displayValues} />
    </Content>
  )
})

const TableRenderer = memo(({ value }: { value?: MetaGroupChild[] }) => {
  const currentViewId = useSelectAtomValue(GroupStateAtom, s => s.currentView?.id)
  return (
    <Content flex column style={{ height: 0, flex: 1, padding: '0px 60px', width: '100%' }}>
      <Content role={'table-wrapper'} style={{ width: '100%', height: 'auto' }}>
        <GroupTableHeader key={currentViewId} />
        <TableBodyRenderer value={value} />
      </Content>
      <div style={{ height: 500, width: 1, flexShrink: 0 }}></div>
    </Content>
  )
})
