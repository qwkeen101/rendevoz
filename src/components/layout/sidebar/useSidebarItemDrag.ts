import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
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
  const isPressedRef = useRef(false)
  const { findParentCollections, moveItems } = useCollectionStore()
  const emitter = useGlobalEventEmitter()
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
          console.log(prevDraggingState, sidebarDraggingState)
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
        } else if (GlobalDragOverlayInstance.draggingDetails?.type === 'metaElement') {
          CollectionStore.addItemToCollection({ id: GlobalDragOverlayInstance.draggingDetails.metaId, type: 'meta' }, id)
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
      GlobalDragOverlayInstance.addDragElements?.(cloned)
    }
    if (e.type === 'pointermove') {
      if (isPressedRef.current) {
        GlobalDragOverlayInstance.startDrag?.()
        sidebarDraggingState.current = {
          draggingItemId: id,
          draggingItemType: type,
          sourceFromId: parentId,
          sourceFromType: parentType,
          itemIsInRoot: isInRoot
        }
        switch (type) {
          case 'document': {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'pdf',
              pdfId: id
            }
            break
          }
          case 'whiteboard': {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'whiteboard',
              whiteboardId: id
            }
            break
          }
          case 'collection': {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'collection',
              collectionId: id
            }
            break
          }
          case 'note': {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'note',
              noteId: id
            }
            break
          }
          case 'meta': {
            GlobalDragOverlayInstance.draggingDetails = {
              type: 'metaElement',
              metaId: id
            }
          }
        }
      }
    }
    if (e.type === 'pointerenter') {
      if (isDragging) {
        if (id !== sidebarDraggingState.current?.draggingItemId) {
          setHovered(true)
        }
        const draggingEle = GlobalDragOverlayInstance.draggingDetails
        if (draggingEle) {
          let drop = false
          switch (draggingEle.type) {
            case 'pdf':
            case 'whiteboard':
            case 'note':
            case 'metaElement':
              drop = true
              break
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
