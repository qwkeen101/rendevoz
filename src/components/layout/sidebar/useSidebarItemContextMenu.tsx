import { AnimatePopover, Menu, WithBorder } from '@/components'
import { Position } from '@/types'
import { CollectionStore } from '@/api/stores'
import { RefObject, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { useTranslation } from 'react-i18next'
import { ObjectActionMenu } from '@/core'
import trans from '@/consts/trans'
import { Icons } from '@/consts'
import CollectionMenu from '@/core/components/collection/CollectionMenu'

const useSidebarItemContextMenu = (
  contextMenuElementRef: RefObject<HTMLElement>,
  item: {
    type: 'collection' | 'meta'
    id: number
  },
  {
    pinned,
    parentId
  }: {
    pinned?: boolean
    parentId?: number
  } = {}
) => {
  const [contextMenuState, setContextMenuState] = useState<
    Partial<
      Position & {
        contextMenuVisible: boolean
      }
    >
  >({
    contextMenuVisible: false
  })
  const { t } = useTranslation()
  const contextMenuHandler = (e: MouseEvent) => {
    setContextMenuState({
      left: e.clientX,
      top: e.clientY,
      contextMenuVisible: true
    })
  }
  useEffect(() => {
    contextMenuElementRef?.current?.addEventListener('contextmenu', contextMenuHandler)
    return () => {
      contextMenuElementRef?.current?.removeEventListener('contextmenu', contextMenuHandler)
    }
  })
  const portal = createPortal(
    <AnimatePopover
      visible={contextMenuState.contextMenuVisible}
      positions={['right']}
      align="start"
      onVisiblityChange={v => setContextMenuState(s => ({ ...s, contextMenuVisible: v }))}
      onClickOutside={() => setContextMenuState(s => ({ ...s, contextMenuVisible: false }))}
      position={{
        left: contextMenuState.left,
        top: contextMenuState.top
      }}
      content={setV =>
        item.type === 'collection' ? (
          <WithBorder onClick={e => e.stopPropagation()} padding={'0.4rem 0'} width={150}>
            <CollectionMenu id={item.id} onClose={() => setV(false)} />
          </WithBorder>
        ) : (
          <WithBorder onClick={e => e.stopPropagation()}>
            <ObjectActionMenu
              parentCollectionId={parentId}
              visibility={{ deleteFromCollection: true }}
              onClose={() => setV(false)}
              metaObjectId={item.id}
            />
          </WithBorder>
        )
      }
    ></AnimatePopover>,
    document.body
  )
  return {
    contextMenuPortal: portal
  }
}

export default useSidebarItemContextMenu
