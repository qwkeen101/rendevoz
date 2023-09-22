import { assignProperties } from '@/utils'
import { memo, useRef } from 'react'
import { useSelectAtomValue } from '@/hooks'
import { TableStateAtom } from '@/core/group/hooks/useTableState'
import { Content, VirtualList } from '@/components'
import { useTableInstance } from '@/core/group/hooks/useTableInstance'
import useGroupDrag from '@/core/group/hooks/drag/useGroupDrag'
import { useVirtualizer, Virtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild } from '~/typings'
import { RowWrapper } from '@/core/group/components/table/RowWrapper'
import { useGroupInstance } from '@/core/group/hooks/useGroupInstance'
import useAssignBodyOps from '@/core/group/hooks/ops/useAssignBodyOps'
import useGroupSelect from '@/core/group/hooks/select/useGroupSelect'
import PlaceholderRow from '@/core/group/components/table/PlaceholderRow'

const TableWrapper = memo(({ value }: { value: MetaGroupChild[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()
  const virtualizer = useVirtualizer({
    getScrollElement: () => ref.current,
    overscan: 10,
    estimateSize: () => 30,
    count: value.length
  })
  instance.getScrollElement = () => ref.current
  const renderSelectBox = useGroupSelect(ref.current)
  useAssignBodyOps(instance, ref, virtualizer)
  const headers = useSelectAtomValue(TableStateAtom, s => s.headers)
  const items = virtualizer.getVirtualItems()
  // root layer, path is the first index
  return (
    <Content
      flex
      column
      fullHeight
      ref={ref}
      style={{
        width: 'auto',
        overflowY: 'auto',
        padding: '0px 60px'
      }}
    >
      {renderSelectBox()}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: headers.reduce((prev, curr) => prev + curr.width, 0) + 12,
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div style={{ position: 'relative', transform: `translateY(${items[0].start}px)` }}>
          {items.map(i => (
            <div key={i.key} data-index={i.index} ref={virtualizer.measureElement}>
              <RowWrapper rowDetails={value[i.index]} path={[i.index]} />
            </div>
          ))}
        </div>
      </div>
      <PlaceholderRow/>
    </Content>
  )
})

export default TableWrapper
