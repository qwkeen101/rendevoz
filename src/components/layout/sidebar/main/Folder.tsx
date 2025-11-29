import SidebarCollection from '@/components/layout/sidebar/SidebarCollection'
import { ISidebarWidgetProps } from '@/components/layout/sidebar/main/index'
import { AnimatePopover, Tooltip, Icon } from '@/components'
import Zindexes from '@/consts/zindex'
import { memo, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useMemoizedFn } from '@/hooks'
import { CollectionStore } from '@/api/stores'
import { useGlobalIsDragging } from '@/core'
import trans from '@/consts/trans'
import KeyvalueStore from '@/api/stores/keyvalue.store'

const SIDEBAR_COLLAPSE_KEY = 'commonSidebar'
export default memo(() => {
  const collapsed = KeyvalueStore.useValue('sidebarExpandData')?.includes(SIDEBAR_COLLAPSE_KEY)
  const [dropVisible, toggleDropVisible] = useState(false)
  const { t } = useTranslation()
  const containerRef = useRef<HTMLDivElement>(null)
  const { moveItems } = CollectionStore
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerleave') {
      toggleDropVisible(false)
    }
    if (e.type === 'pointerup') {
      toggleDropVisible(false)
    }
    const draggingEle = Global.values.draggingDetails
    if (draggingEle) {
      if (draggingEle.type === 'collection') {
        if (e.type === 'pointerenter') {
          toggleDropVisible(true)
        }
        if (e.type === 'pointerup') {
          const dragState = CollectionStore.dragState
          if (dragState?.draggingItemType === 'collection') {
            moveItems(
              {
                id: dragState.draggingItemId,
                type: dragState.draggingItemType
              },
              dragState.sourceFromId,
              0
            )
          }
        }
      }
    }
  })
  const [globalIsDragging] = useGlobalIsDragging()
  useEffect(() => {
    const ele = containerRef.current
    if (ele) {
      if (globalIsDragging) {
        ele.addEventListener('pointerenter', pointerHandler)
        ele.addEventListener('pointerleave', pointerHandler)
        ele.addEventListener('pointerup', pointerHandler)
        return () => {
          ele.removeEventListener('pointerenter', pointerHandler)
          ele.removeEventListener('pointerleave', pointerHandler)
          ele.removeEventListener('pointerup', pointerHandler)
        }
      }
    }
  }, [globalIsDragging])
  return (
    <>
      <AnimatePopover
        visible={dropVisible}
        positions={['top']}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
        content={'Move collection to root'}
        innerRef={containerRef}
      >
        <div
          onClick={() => {
            const current = KeyvalueStore.getOne('sidebarExpandData')
            KeyvalueStore.updateOne(
              'sidebarExpandData',
              current?.includes(SIDEBAR_COLLAPSE_KEY)
                ? current?.filter(i => i !== SIDEBAR_COLLAPSE_KEY)
                : [...(current || []), SIDEBAR_COLLAPSE_KEY]
            )
          }}
          className={'group flex items-center button !py-1.5 justify-between'}
        >
          <div className={'menu-sub-title'}>{t(trans.Folders)}</div>
          <Tooltip position="top" content={t('sidebar.Create new folder')}>
            <Icon
              name="park-plus"
              size={15}
              onClick={e => {
                e.stopPropagation()
                CollectionStore.create()
              }}
              strokeWidth={4}
              className={'hover-active-button'}
            />
          </Tooltip>
        </div>
      </AnimatePopover>
      {collapsed ? null : <SidebarCollection />}
    </>
  )
})
