import { memo, useEffect, useRef } from 'react'
import { Content } from '@/components'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild } from '~/typings'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import PlaceholderRow from '@/core/components/group/components/table/PlaceholderRow'

const TableWrapper = memo(({ value = [] }: { value: MetaGroupChild[] }) => {
  const ref = useRef<HTMLDivElement>(null)
  const instance = useGroupInstance()
  const virtualizer = useVirtualizer({
    overscan: 5,
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 30,
    debug: true,
    count: value.length
  })

  instance.getScrollMargin = () => ref.current?.parentElement?.parentElement?.parentElement?.offsetTop ?? 0
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
          height: virtualizer.getTotalSize(),
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
            transform: `translateY(${items[0]?.start ?? 0}px)`
          }}
        >
          {items.map(i => (
            <div key={i.key} data-index={i.index} ref={virtualizer.measureElement}>
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
