import { useGlobalIsDragging } from '@/core'
import { Rendevoz } from '@/core/rendevoz'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useMemoizedFn } from '@/hooks'
import { CollectionStore } from '@/stores'
import useCollectionStore from '@/stores/collection.store'
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
  draggableElementRef?: RefObject<HTMLElement>
  droppableElementRef?: RefObject<HTMLElement>
  isInRoot: boolean
  parentId: giveMeGoodName['sourceFromId']
  parentType: giveMeGoodName['sourceFromType']
}) => {
  const { id, type, draggableElementRef, droppableElementRef, isInRoot, parentId, parentType } = options
  const [isDragging] = useGlobalIsDragging()
  const [hovered, setHovered] = useState(false)
  const [droppable, setDroppable] = useState(false)
  const DragState = Rendevoz.Actions.State.Drag
  const isPressedRef = useRef(false)
  const { findParentCollections, moveItems } = useCollectionStore()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const globalDragEndHandler = useMemoizedFn(({ event }: { event: PointerEvent }) => {
    isPressedRef.current = false
    setTimeout(() => (sidebarDraggingState.current = undefined))
    if (droppableElementRef?.current?.contains(event.target as HTMLElement)) {
      const prevDraggingState = sidebarDraggingState.current ? structuredClone(sidebarDraggingState.current) : undefined
      setHovered(false)
      if (prevDraggingState?.draggingItemId === id) return
      if (!droppable || !id || !type) return
      if (isDroppableItem(type)) {
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
  })
  useEffect(() => {
    const handler = new GlobalEventHandler()
    handler.on('globalDragPointerUp', ({ event }) => globalDragEndHandler({ event }))
    emitter.addListener('global', handler)
    return () => {
      emitter.removeListener('global', handler)
    }
  }, [])
  const pointerHandler = useMemoizedFn(async (e: MouseEvent) => {
    if (e.type === 'pointerup') {
      isPressedRef.current = false
    }
    if (e.type === 'pointerdown') {
      isPressedRef.current = true
      const cloned = draggableElementRef?.current?.cloneNode(true) as HTMLElement
      cloned.style.width = `${draggableElementRef?.current?.clientWidth}px`
      cloned.style.height = `${draggableElementRef?.current?.clientHeight}px`
      DragState.addDragElements?.(cloned)
    }
    if (e.type === 'pointermove') {
      if (isPressedRef.current) {
        DragState.startDrag?.()
        sidebarDraggingState.current = {
          draggingItemId: id,
          draggingItemType: type,
          sourceFromId: parentId,
          sourceFromType: parentType,
          itemIsInRoot: isInRoot
        }
        switch (type) {
          case 'document': {
            DragState.setDraggingDetails({
              type: 'pdf',
              pdfId: id
            })
            break
          }
          case 'whiteboard': {
            DragState.setDraggingDetails({
              type: 'whiteboard',
              whiteboardId: id
            })
            break
          }
          case 'collection': {
            DragState.setDraggingDetails({
              type: 'collection',
              collectionId: id
            })
            break
          }
          case 'note': {
            DragState.setDraggingDetails({
              type: 'note',
              noteId: id
            })
            break
          }
          case 'meta': {
            DragState.setDraggingDetails({
              type: 'metaElement',
              metaId: id
            })
          }
        }
      }
    }
    if (e.type === 'pointerenter') {
      if (isDragging) {
        if (id !== sidebarDraggingState.current?.draggingItemId) {
          setHovered(true)
        }
        const draggingEle = DragState.getDraggingDetails()
        if (draggingEle) {
          let drop = false
          switch (draggingEle.type) {
            case 'collection': {
              if (type === 'collection') {
                const myParentCollections = await findParentCollections(id)
                if (myParentCollections?.some(i => i.id === draggingEle.collectionId)) {
                  drop = false
                } else {
                  drop = true
                }
                break
              }
              drop = false
              break
            }
            default: {
              drop = true
              break
            }
          }
          setDroppable(drop)
        }
      }
    }
    if (e.type === 'pointerleave') {
      setDroppable(false)
      setHovered(false)
    }
  })

  useEffect(() => {
    draggableElementRef?.current?.addEventListener('pointerdown', pointerHandler)
    draggableElementRef?.current?.addEventListener('pointermove', pointerHandler)
    draggableElementRef?.current?.addEventListener('pointerleave', pointerHandler)
    draggableElementRef?.current?.addEventListener('pointerenter', pointerHandler)
    document.addEventListener('pointerup', pointerHandler)
    return () => {
      draggableElementRef?.current?.removeEventListener('pointerdown', pointerHandler)
      draggableElementRef?.current?.removeEventListener('pointermove', pointerHandler)
      draggableElementRef?.current?.removeEventListener('pointerleave', pointerHandler)
      draggableElementRef?.current?.removeEventListener('pointerenter', pointerHandler)
      document.removeEventListener('pointerup', pointerHandler)
    }
  })
  return {
    droppable,
    isDragging,
    hovered
  }
}

export default useSidebarItemDrag
