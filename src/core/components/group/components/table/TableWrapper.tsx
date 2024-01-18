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
  const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew)
  const m = instance.getScrollMargin?.() ?? 0
  const virtualizer = useVirtualizer({
    overscan: 5,
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 30,
    count: value.length,
    scrollMargin: m,
    paddingEnd: 200
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
          width: '100%',
          position: 'relative',
          flexShrink: 0
        }}
      >
        <div
          role={'table-wrapper'}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: items.length ? `translateY(${(items[0]?.start ?? 0) - m}px)` : undefined
          }}
        >
          {items.map(i => (
            <div key={value[i.index].rowId} data-index={i.index} ref={virtualizer.measureElement}>
              <RowWrapper rowDetails={value[i.index]} path={[i.index]} />
            </div>
          ))}
          {(items[items.length - 1]?.index === value.length - 1 || value.length === 0) && showAddMore !== false && <PlaceholderRow />}
        </div>
      </div>
    </Content>
  )
})

export default TableWrapper
