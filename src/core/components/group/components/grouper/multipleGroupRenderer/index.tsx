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

export default function GroupGrouperRenderer() {
  const instance = useGroupInstance()
  const currentViewType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.type)
  const currentGroupers = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const containerRef = useRef<HTMLDivElement>(null)
  const groupFieldType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group?.fieldType)
  const scrollMargin = containerRef.current?.closest('[role="renderer-container"]')?.offsetTop ?? 0
  const unHiddenGroupers = currentGroupers?.filter(i => !i.hidden)
  const virtualizer = useVirtualizer({
    getScrollElement: () => instance.values.pageContainer,
    estimateSize: () => 500,
    count: unHiddenGroupers?.length ?? 0,
    scrollMargin: scrollMargin,
    paddingEnd: 200,
    overscan: 1
  })

  const items = virtualizer.getVirtualItems()
  console.log(items, scrollMargin)
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
              if (groupFieldType === 'metaType') {
                showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(group.name)
              }
              return (
                <div
                  className={i.index !== 0 ? 'border-top' : undefined}
                  ref={virtualizer.measureElement}
                  data-index={i.index}
                  key={group.id}
                  style={{ padding: '0px 0px 16px', margin: '0px 60px' }}
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
              if (groupFieldType === 'metaType') {
                showAddMore = !!GlobalInstance.metaOps?.canCreateDirectly(group.name)
              }
              return (
                <div ref={virtualizer.measureElement} data-index={i.index} key={group.id}>
                  <GrouperHeader
                    style={{
                      paddingLeft: 60,
                      top: 0,
                      background: Colors.Background.Global,
                      position: 'sticky',
                      zIndex: 10
                    }}
                    group={group}
                  />
                  {group.visible !== false && (
                    <GalleryRenderer showAddMore={showAddMore} grouperId={group.id} enableVirtualizer={false} value={group.values} />
                  )}
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
