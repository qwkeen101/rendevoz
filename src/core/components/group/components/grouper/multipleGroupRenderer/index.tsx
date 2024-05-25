import { GlobalInstance, useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useVirtualizer } from '@tanstack/react-virtual'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { Content } from '@/components'
import TableRenderer from '@/core/components/group/components/table/TableRenderer'
import GrouperHeader from '@/core/components/group/components/grouper/headers'
import ListRenderer from '@/core/components/group/components/list/ListRenderer'
import { Colors } from '@/consts'
import { useRef } from 'react'
import GalleryRenderer from '@/core/components/group/components/gallery/GalleryRenderer'
import KanbanRenderer from '@/core/components/group/components/kanban/KanbanRenderer'
import { assignProperties } from '@/utils'
import GalleryHideLabelSource from '@/core/components/group/components/grouper/multipleGroupRenderer/GalleryHideLabelSource'

export default function GroupGrouperRenderer() {
  const instance = useGroupInstance()
  const currentViewType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  const currentGroupers = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const containerRef = useRef<HTMLDivElement>(null)
  const groupFieldType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group?.fieldType)
  const scrollMargin = containerRef.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
  const unHiddenGroupers = currentGroupers?.filter(i => !i.hidden)
  const paddingBottom = useSelectAtomValue(GroupStateAtom, s => s.styles?.bottomPadding) ?? 100
  const virtualizer = useVirtualizer({
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 500,
    count: unHiddenGroupers?.length ?? 0,
    scrollMargin: scrollMargin,
    paddingEnd: paddingBottom,
    overscan: 1
  })
  instance.virtualizer = virtualizer
  if (currentViewType !== 'kanban') {
    assignProperties(instance, {
      bodyOps: {
        ...instance.bodyOps,
        scrollToMeta: (metaId, select) => {
          if (currentGroupers) {
            const targetGroupIdx = currentGroupers.findIndex(i => i.values.some(o => o.id === metaId))
            if (targetGroupIdx >= 0) {
              virtualizer.scrollToIndex(targetGroupIdx)
              const targetRow = currentGroupers[targetGroupIdx].values.find(i => i.id === metaId)
              targetRow &&
                setTimeout(() => {
                  instance.values.inViewRowFuncs.get(targetRow.tempRowId || targetRow.rowId)?.scrollIntoView()
                })
              if (select && targetRow) {
                instance.selectOps?.selectItem(targetRow.tempRowId || targetRow.rowId)
              }
            }
          }
        }
      }
    })
  }
  const items = virtualizer.getVirtualItems()
  const bodyRenderer = () => {
    if (currentViewType === 'kanban') {
      return <KanbanRenderer />
    }
    if (currentViewType === 'table') {
      return (
        <>
          {items.map(i => {
            const group = unHiddenGroupers?.[i.index]
            if (group) {
              if (group.hidden) return null
              let showAddMore = true
              if (groupFieldType === 'containedIn') {
                showAddMore = false
              }
              if (groupFieldType === 'metaType') {
                showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(group.name)
              }
              return (
                <TableRenderer
                  showAddMore={showAddMore}
                  ref={virtualizer.measureElement}
                  data-index={i.index}
                  key={group.id}
                  grouperId={group.id}
                  bodyVisible={!!group.visible}
                  extraHeaderNode={<GrouperHeader group={group} />}
                  enableVirtualizer={false}
                  value={group.values}
                />
              )
            }
          })}
        </>
      )
    }
    if (currentViewType === 'list') {
      return (
        <>
          {items?.map(i => {
            const group = unHiddenGroupers?.[i.index]
            if (group) {
              if (group.hidden) return null
              let showAddMore = true
              if (groupFieldType === 'containedIn') {
                showAddMore = false
              }
              if (groupFieldType === 'metaType') {
                showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(group.name)
              }
              return (
                <div
                  className={i.index !== 0 ? 'border-top' : undefined}
                  ref={virtualizer.measureElement}
                  data-index={i.index}
                  key={group.id}
                  style={{ padding: '0px 0px 16px', margin: '0px var(--page-padding-right) 0px var(--page-padding-left)' }}
                >
                  <GrouperHeader
                    style={{
                      top: 0,
                      background: Colors.Background.Global,
                      position: 'sticky',
                      zIndex: 10,
                      paddingLeft: 4
                    }}
                    group={group}
                  />
                  {group.visible !== false && (
                    <ListRenderer
                      style={{ padding: 0 }}
                      showAddMore={showAddMore}
                      grouperId={group.id}
                      enableVirtualizer={false}
                      value={group.values}
                    />
                  )}
                </div>
              )
            }
          })}
        </>
      )
    }
    if (currentViewType === 'gallery') {
      return (
        <>
          {items?.map(i => {
            const group = unHiddenGroupers?.[i.index]
            if (group) {
              if (group.hidden) return null
              let showAddMore = true
              if (groupFieldType === 'containedIn') {
                showAddMore = false
              }
              if (groupFieldType === 'metaType') {
                showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(group.name)
              }
              return (
                <div ref={virtualizer.measureElement} data-index={i.index} key={group.id}>
                  <GrouperHeader
                    style={{
                      paddingLeft: 'var(--page-padding-left)',
                      top: 0,
                      background: Colors.Background.Global,
                      position: 'sticky',
                      zIndex: 10
                    }}
                    group={group}
                  />
                  {group.visible !== false &&
                    (groupFieldType === 'containedIn' ? (
                      <GalleryHideLabelSource group={group}>
                        <GalleryRenderer showAddMore={showAddMore} grouperId={group.id} enableVirtualizer={false} value={group.values} />
                      </GalleryHideLabelSource>
                    ) : (
                      <GalleryRenderer showAddMore={showAddMore} grouperId={group.id} enableVirtualizer={false} value={group.values} />
                    ))}
                </div>
              )
            }
          })}
        </>
      )
    }
  }
  const body = bodyRenderer()
  if (currentViewType === 'kanban' && body) {
    return body
  }
  if (body) {
    return (
      <div
        ref={containerRef}
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          flexShrink: 0,
          position: 'relative'
        }}
      >
        <Content
          style={{
            position: 'absolute',
            top: (items[0]?.start ?? 0) - scrollMargin,
            left: 0,
            minWidth: '100%',
            width: currentViewType !== 'table' ? '100%' : undefined
          }}
        >
          {body}
        </Content>
      </div>
    )
  }
  return null
}
