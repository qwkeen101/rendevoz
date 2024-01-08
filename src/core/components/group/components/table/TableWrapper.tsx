import { memo, useEffect, useRef } from 'react'
import { Content } from '@/components'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild } from '~/typings'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import PlaceholderRow from '@/core/components/group/components/table/PlaceholderRow'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

const TableWrapper = memo(({ value = [] }: { value: MetaGroupChild[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()
  instance.getScrollMargin = () => ref.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0

  const m = instance.getScrollMargin?.() ?? 0
  const columns = useSelectAtomValue(GroupStateAtom, s => s.headerColumn)
  const virtualizer = useVirtualizer({
    overscan: 5,
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 30,
    count: value.length,
    scrollMargin: m
  })

  instance.virtualizer = virtualizer
  const items = virtualizer.getVirtualItems()
  // root layer, path is the first index
  return (
    <Content
      flex
      column
      ref={ref}
      style={{
        width: '100%',
        fontSize: 14,
        height: 'auto'
      }}
    >
      <div
        style={{
          height: value.length ? virtualizer.getTotalSize() : 0,
          '--table-columns': columns,
          width: '100%',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${(items[0]?.start ?? 0) - m}px)`
          }}
        >
          {items.map(i => (
            <div key={value[i.index].rowId} data-index={i.index} ref={virtualizer.measureElement}>
              <RowWrapper rowDetails={value[i.index]} path={[i.index]} />
            </div>
          ))}
        </div>
      </div>
      <PlaceholderRow />
    </Content>
  )
})

export default TableWrapper
