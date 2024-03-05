import { useDropObjectArea, useGlobalIsDragging } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useMemoizedFn } from '@/hooks'
import { CollectionStore } from '@/api/stores'
import useCollectionStore from '@/api/stores/collection.store'
import { RefObject, useEffect, useRef, useState } from 'react'
import { ICollectionItem } from '~/typings/data'

type giveMeGoodName = Parameters<ReturnType<typeof useCollectionStore>['moveItems']>['0']
export const sidebarDraggingState: {
  current:
    | {
        draggingItemId: number
        draggingItemType: giveMeGoodName['item']['type']
        itemIsInRoot: boolean
        sourceFromType: giveMeGoodName['sourceFromType']
        sourceFromId: giveMeGoodName['sourceFromId']
      }
    | undefined
} = {
  current: undefined
}

const isDroppableItem = (itemType: ICollectionItem['type']): itemType is giveMeGoodName['targetToType'] => {
  if (itemType && ['collection'].includes(itemType)) {
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
  parentId: giveMeGoodName['sourceFromId']
  parentType: giveMeGoodName['sourceFromType']
}) => {
  const { id, type, draggableElementRef, droppableElementRef, isInRoot, parentId, parentType } = options
  const [hovered, setHovered] = useState(false)
  const [droppable, setDroppable] = useState(false)
  const DragState = Rendevoz.Actions.State.Drag
  const isPressedRef = useRef(false)
  const { findParentCollections, moveItems } = useCollectionStore()

  const { isDragging, canDropAsMeta } = useDropObjectArea(droppableElementRef, {
    onDragLeave: () => {
      setDroppable(false)
      setHovered(false)
    },
    onDragOver: async element => {
      if (id !== sidebarDraggingState.current?.draggingItemId) {
        setHovered(true)
      }
      if (element.type === 'collection' && type === 'collection') {
        const myParentCollections = await findParentCollections(id)
        if (myParentCollections?.some(i => i.id === element.collectionId)) {
          setDroppable(false)
        } else {
          setDroppable(true)
        }
        return
      }
      setDroppable(!!(canDropAsMeta.droppable || canDropAsMeta.metaId))
    },
    onDrop: element => {
      const prevDraggingState = sidebarDraggingState.current ? structuredClone(sidebarDraggingState.current) : undefined
      setHovered(false)
      setDroppable(false)
      if (prevDraggingState?.draggingItemId === id) return
      if (!droppable || !id || !type) return
      if (isDroppableItem(type)) {
        console.log('yes')
        if (prevDraggingState) {
          moveItems({
            targetToType: type,
            targetToId: id,
            targetIsRoot: false,
            sourceFromId: prevDraggingState.sourceFromId,
            sourceFromType: prevDraggingState.sourceFromType,
            sourceIsRoot: prevDraggingState.itemIsInRoot,
            item: {
              id: prevDraggingState.draggingItemId,
              type: prevDraggingState.draggingItemType
            }
          })
          return
        } else {
          if (canDropAsMeta.metaId) {
            CollectionStore.addItemToCollection({ id: canDropAsMeta.metaId, type: 'meta' }, id)
          } else {
            if (canDropAsMeta.droppable) {
              Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
                type: 'globalDropNeedFurtherProcess',
                data: {
                  draggingElement: DragState.getDraggingDetails(),
                  e: event
                }
              }).then(res => {
                if (res) {
                  CollectionStore.addItemToCollection({ id: res.id, type: 'meta' }, id)
                }
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
      setTimeout(() => (sidebarDraggingState.current = undefined))
    }
  })
  return {
    droppable,
    isDragging,
    hovered
  }
}

export default useSidebarItemDrag
