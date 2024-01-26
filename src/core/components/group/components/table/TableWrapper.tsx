import { memo, useRef } from 'react'
import { Content } from '@/components'
import { useVirtualizer } from '@tanstack/react-virtual'
import { MetaGroupChild } from '~/typings'
import { RowWrapper } from '@/core/components/group/components/table/RowWrapper'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import PlaceholderRow from '@/core/components/group/components/table/PlaceholderRow'
import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

const TableWrapper = memo(
  ({
    value = [],
    enableVirtualizer = true,
    grouperId,
    showAddMore: outShowAddNew
  }: {
    value: MetaGroupChild[]
    showAddMore?: boolean
    enableVirtualizer?: boolean
    grouperId?: number
  }) => {
    const ref = useRef<HTMLDivElement>(null)
    const instance = useGroupInstance()
    const showAddMore = useSelectAtomValue(GroupStateAtom, s => s.layout?.showAddNew) ?? true
    const tableColumns = useSelectAtomValue(GroupStateAtom, s => s.headerColumn)
    const headers = useSelectAtomValue(GroupStateAtom, s => s.visibleProperties)
    const showOriginal = useSelectAtomValue(GroupStateAtom, s => s.showOriginalText)
    const showDeleted = useSelectAtomValue(GroupStateAtom, s => s.layout?.showDeletedMetas)
    const wrap = useSelectAtomValue(GroupStateAtom, s => s.currentView?.options.wrapColumns)
    const unToggledIdSet = useSelectAtomValue(GroupStateAtom, s => s.unToggledIdSet)
    const shiftKeyPressed = useSelectAtomValue(GroupStateAtom, s => s.shiftPressed)
    if (enableVirtualizer) {
      instance.getScrollMargin = () => ref.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
      const m = instance.getScrollMargin?.() ?? 0
      const virtualizer = useVirtualizer({
        overscan: enableVirtualizer ? 5 : value.length,
        getScrollElement: () => instance.values.pageContainer,
        estimateSize: () => 30,
        count: value.length,
        scrollMargin: enableVirtualizer ? m : 0,
        paddingEnd: enableVirtualizer ? 200 : 0
      })

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
                  <RowWrapper
                    headerColumns={tableColumns}
                    showOriginalText={showOriginal}
                    untoggledIdSet={unToggledIdSet}
                    headers={headers}
                    wrapContent={wrap}
                    showDeletedMeta={showDeleted}
                    shiftKeyPressed={shiftKeyPressed}
                    rowDetails={value[i.index]}
                  />
                </div>
              ))}
              {(items[items.length - 1]?.index === value.length - 1 || value.length === 0) && showAddMore !== false && (
                <PlaceholderRow grouperId={grouperId} />
              )}
            </div>
          </div>
        </Content>
      )
    } else {
      return (
        <Content
          flex
          column
          role={'table-wrapper'}
          ref={ref}
          style={{
            width: '100%',
            fontSize: 14,
            height: 'auto'
          }}
        >
          {value.map(i => (
            <RowWrapper
              key={i.rowId}
              headerColumns={tableColumns}
              showOriginalText={showOriginal}
              untoggledIdSet={unToggledIdSet}
              headers={headers}
              wrapContent={wrap}
              showDeletedMeta={showDeleted}
              shiftKeyPressed={shiftKeyPressed}
              rowDetails={i}
            />
          ))}
          {outShowAddNew && showAddMore && <PlaceholderRow grouperId={grouperId} />}
        </Content>
      )
    }
  }
)

export default TableWrapper
