import { useSelectAtomValue } from '@/hooks'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { Content, Virtualizer } from '@/components'
import KanbanList from '@/core/components/group/components/kanban/KanbanList'
import GrouperHeader from '@/core/components/group/components/grouper/headers'
import { memo, useRef } from 'react'
import { MetaGroup } from '~/typings'
import { assignProperties } from '@/utils'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import scrollIntoView from 'scroll-into-view-if-needed'
import GalleryHideLabelSource from '@/core/components/group/components/grouper/multipleGroupRenderer/GalleryHideLabelSource'

type View = MetaGroup['views'][0]
export default memo(() => {
  const currentViewGroups = useSelectAtomValue(GroupStateAtom, s => s.groups)
  const groupFieldType = useSelectAtomValue(GroupStateAtom, s => s.currentView?.group?.fieldType)
  const cardSize = useSelectAtomValue(GroupStateAtom, s => (s.currentView as undefined | (View & { type: 'gallery' }))?.options.cardSize)
  const instance = useGroupInstance()
  const containerRef = useRef<HTMLDivElement>(null)
  const idxToVirtualizerRef = useRef<Record<number, Virtualizer<any, any>>>({})
  if (!currentViewGroups) return null
  let size = 280
  switch (cardSize) {
    case 'small': {
      size = 220
      break
    }
    case 'medium': {
      size = 280
      break
    }
    case 'large': {
      size = 360
      break
    }
  }
  assignProperties(instance, {
    bodyOps: {
      ...instance.bodyOps,
      scrollToMeta: (metaId, select) => {
        const targetIdx = currentViewGroups.findIndex(i => i.values.some(o => o.id === metaId))
        if (targetIdx >= 0) {
          const targetList = containerRef.current?.querySelector(`[data-idx="${targetIdx}"]`)
          console.log(targetList, targetIdx)
          if (targetList) {
            scrollIntoView(targetList, { block: 'center', scrollMode: 'if-needed', behavior: 'auto' })
            const target = currentViewGroups[targetIdx]
            const row = target.values.find(i => i.id === metaId)
            if (row) {
              const rowIdx = target.values.indexOf(row)
              idxToVirtualizerRef.current[targetIdx]?.scrollToIndex(rowIdx, { align: 'center' })
              if (select) {
                instance.selectOps?.selectItem(row.tempRowId || row.rowId)
              }
            }
          }
        }
      }
    }
  })
  return (
    <Content ref={containerRef} flex gap={2} style={{ padding: '0px var(--page-padding-right) 0px var(--page-padding-right)' }}>
      {currentViewGroups.map((i, idx) => {
        if (i.hidden) return null
        let showAddMore = true
        if (groupFieldType === 'metaType') {
          showAddMore = !!Global.metaOps?.canCreateDirectly(i.name)
        }
        if (groupFieldType === 'containedIn') {
          showAddMore = false
        }
        return (
          <Content data-idx={idx} key={i.id} style={{ flexShrink: 0, width: size }}>
            <GrouperHeader
              style={{
                padding: '0px 10px 8px'
              }}
              group={i}
              showToggle={false}
            />
            {groupFieldType === 'containedIn' ? (
              <GalleryHideLabelSource group={i}>
                <KanbanList
                  onVirtualizerInitialized={v => {
                    idxToVirtualizerRef.current[idx] = v
                  }}
                  showAddMore={showAddMore}
                  grouperId={i.id}
                  key={i.id}
                  values={i.values}
                />
              </GalleryHideLabelSource>
            ) : (
              <KanbanList
                onVirtualizerInitialized={v => {
                  idxToVirtualizerRef.current[idx] = v
                }}
                showAddMore={showAddMore}
                grouperId={i.id}
                key={i.id}
                values={i.values}
              />
            )}
          </Content>
        )
      })}
    </Content>
  )
})
