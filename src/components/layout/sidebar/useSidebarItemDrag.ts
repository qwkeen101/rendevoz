import { useDropObjectArea } from '@/core'
import { CollectionStore } from '@/api/stores'
import { RefObject, useState } from 'react'
import { ICollectionItem } from '~/typings/data'

const isDroppableItem = (itemType: ICollectionItem['type']): boolean => {
  if (itemType && itemType === 'collection') {
    return true
  }
  return false
}

const useSidebarItemDrag = (options: {
  id: number
  type: ICollectionItem['type']
  draggableElementRef: RefObject<HTMLElement>
  droppableElementRef: RefObject<HTMLElement>
  isInRoot: boolean
  parentId?: number
}) => {
  const { id, type, droppableElementRef } = options
  const [hovered, setHovered] = useState(false)
  const [droppable, setDroppable] = useState(false)
  const { findParentCollections, moveItems } = CollectionStore

  const { isDragging, canDropAsMeta } = useDropObjectArea(droppableElementRef, {
    onDragLeave: () => {
      setDroppable(false)
      setHovered(false)
    },
    onDragOver: async element => {
      if (id !== CollectionStore.dragState?.draggingItemId) {
        setHovered(true)
      }
      if (element.type === 'collection' && type === 'collection') {
        const myParentCollections = findParentCollections(id)
        if (myParentCollections?.some(i => i.id === element.collectionId)) {
          setDroppable(false)
        } else {
          setDroppable(true)
        }
        return
      }
      setDroppable(!!(canDropAsMeta.droppable || canDropAsMeta.metaId))
    },
    onDrop: () => {
      const prevDraggingState = CollectionStore.dragState ? { ...CollectionStore.dragState } : undefined
      setHovered(false)
      setDroppable(false)
      if (prevDraggingState?.draggingItemId === id) return
      if (!droppable || !id || !type) return
      if (isDroppableItem(type)) {
        if (prevDraggingState) {
          moveItems(
            {
              id: prevDraggingState.draggingItemId,
              type: prevDraggingState.draggingItemType
            },
            prevDraggingState.sourceFromId,
            id
          )
          return
        } else {
          if (canDropAsMeta.metaId) {
            CollectionStore.addItemToCollection({ id: canDropAsMeta.metaId, type: 'meta' }, id)
          } else {
            if (canDropAsMeta.droppable) {
              Global.metaOps.addDraggableAsMeta(undefined).then(res => {
                CollectionStore.addItemToCollection(
                  res.map(i => ({ id: i.id, type: 'meta' })),
                  id
                )
              })
            }
          }
        }
      }
    },
    onDragEnd: () => {
      setTimeout(() => {
        setDroppable(false)
        setHovered(false)
      }, 20)
      setTimeout(() => (CollectionStore.dragState = undefined))
    }
  })
  return {
    droppable,
    isDragging,
    hovered
  }
}

export default useSidebarItemDrag
