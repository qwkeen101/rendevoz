import { AnimatePopover } from '@/components/base'
import Modal from '@/components/base/Modal'
import CollectionForm from '@/components/form/CollectionForm'
import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay/GlobalDragOverlay'
import Zindexes from '@/consts/zindex'
import { useMemoizedFn } from '@/hooks'
import useCollectionStore, { rootCollectionsAtom } from '@/stores/collection.store'
import { globalStore, collectionStore } from '@/stores'
import ClassName from '@/styles/classNames'
import getEmoji from '@/utils/emoji'
import { css } from '@emotion/css'
import { useAtomValue } from 'jotai/react'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import Content from '../../base/Content'
import Icon from '../../base/Icon'
import SidebarCollectionItem from './items/SidebarCollectionItem'
import { sidebarDraggingState } from './useSidebarItemDrag'

const SidebarCollection = () => {
  const rootCollections = useAtomValue(rootCollectionsAtom, { store: globalStore })
  const [newCollectionVisible, setNewCollectionVisible] = useState(false)
  const [globalIsDragging] = useGlobalIsDragging()
  const containerRef = useRef<HTMLDivElement>(null)
  const [dropVisible, toggleDropVisible] = useState(false)
  const { moveItems } = useCollectionStore()
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerleave') {
      toggleDropVisible(false)
    }
    if (e.type === 'pointerup') {
      toggleDropVisible(false)
    }
    const draggingEle = GlobalDragOverlayInstance.draggingDetails
    if (draggingEle) {
      if (draggingEle.type === 'collection') {
        if (e.type === 'pointerenter') {
          toggleDropVisible(true)
        }
        if (e.type === 'pointerup') {
          if (sidebarDraggingState.draggingItemType === 'collection') {
            moveItems({
              sourceFromId: sidebarDraggingState.sourceFromId,
              sourceFromType: sidebarDraggingState.sourceFromType,
              sourceIsRoot: sidebarDraggingState.itemIsInRoot,
              item: {
                id: sidebarDraggingState.draggingItemId,
                type: sidebarDraggingState.draggingItemType
              },
              targetIsRoot: true,
              targetToType: 'collection'
            })
          }
        }
      }
    }
  })
  useEffect(() => {
    if (globalIsDragging) {
      containerRef.current?.addEventListener('pointerenter', pointerHandler)
      containerRef.current?.addEventListener('pointerleave', pointerHandler)
      containerRef.current?.addEventListener('pointerup', pointerHandler)
      return () => {
        containerRef.current?.removeEventListener('pointerenter', pointerHandler)
        containerRef.current?.removeEventListener('pointerleave', pointerHandler)
        containerRef.current?.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [globalIsDragging])
  const { addCollection } = collectionStore
  return (
    <>
      <Modal noStyle visible={newCollectionVisible} onClose={() => setNewCollectionVisible(false)}>
        <CollectionForm
          onSubmit={collection => {
            setNewCollectionVisible(false)
            addCollection(collection)
          }}
          onBack={() => setNewCollectionVisible(false)}
        />
      </Modal>
      <AnimatePopover
        visible={dropVisible}
        positions={['top']}
        padding={10}
        containerStyle={{ zIndex: String(Zindexes.PopupMenu) }}
        content={
          <div style={{ color: 'white', background: 'rgba(0,0,0,0.8)', padding: '2px 4px', borderRadius: 4, fontSize: 12 }}>
            Move collection to root
          </div>
        }
        innerRef={containerRef}
      >
        <Content
          flex
          alignItems="center"
          justifyContent="space-between"
          className={css([ClassName.description(), dropVisible && ClassName.Drag.droppableItemHovered(true)])}
          style={{ padding: '0px 4px', transition: 'all 0.3s ease' }}
        >
          <div>Collections</div>
          <Icon
            name="park-plus"
            size={14}
            onClick={() => {
              setNewCollectionVisible(true)
            }}
            className={ClassName.circleButton(2, 4)}
          />
        </Content>
      </AnimatePopover>
      <Content flex column style={{ overflowY: 'auto', padding: '0px 2px' }}>
        {rootCollections.map(i => (
          <SidebarCollectionItem key={i.id} id={i.id} parentId={0} parentType="collection" />
        ))}
      </Content>
    </>
  )
}
const linearToSvg = (linear: string) => {
  return linear.match(/rgba\([^()]*\)|#\w+/g)
}
export const IconNameItem = memo(
  ({ name, icon, color, onClick }: { name?: string; icon?: string; color?: string; onClick?: React.MouseEventHandler }) => {
    const isPark = icon?.startsWith('park')
    const emoji = useMemo(() => !isPark && icon && getEmoji(icon), [icon])
    const linearFontColor = color?.startsWith('linear')
    const linearColors = color && linearFontColor && linearToSvg(color)
    return (
      <Content flex alignItems="center" gap={10} style={{ overflow: 'hidden' }} onClick={onClick}>
        {emoji ? (
          <img
            src="data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw=="
            style={{
              width: '1em',
              height: '1em',
              backgroundImage: `url(${emoji?.imageSrc})`,
              backgroundPositionX: `${(emoji?.x * 100) / 60}%`,
              backgroundPositionY: `${(emoji?.y * 100) / 60}%`,
              backgroundRepeat: 'no-repeat',
              backgroundSize: '6100% 6100%',
              verticalAlign: '-0.1em',
              marginRight: 2
            }}
          />
        ) : (
          <>{icon && <Icon fill={linearColors ? linearColors[(linearColors.length / 2) | 0] : color} name={icon} />}</>
        )}
        <div
          style={{
            color: color,
            backgroundImage: linearFontColor ? color : undefined
          }}
          className={css([
            ClassName.ellipsisFont(1),
            linearFontColor && {
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }
          ])}
        >
          {name}
        </div>
      </Content>
    )
  }
)
export default SidebarCollection
