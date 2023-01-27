import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import { useMemoizedFn } from '@/hooks'
import useCollectionStore from '@/stores/collection.store'
import { RefObject, useEffect, useRef, useState } from 'react'
import { ICollection, ICollectionItem, INote, IPdfDocument } from '~/typings/data'

export let sidebarDraggingItem = null
export let sidebarDraggingParentCollectionId = null
const useSidebarItemDrag = (
  item: any,
  type: 'document' | 'collection' | 'note',
  draggableElementRef?: RefObject<HTMLElement>,
  parentCollectionId?: number
) => {
  const [isDragging] = useGlobalIsDragging()
  const [hovered, setHovered] = useState(false)
  const [droppable, setDroppable] = useState(false)
  const [isPressed, setIsPressed] = useState(false)
  const { moveItemBetweenCollections, findParentCollections } = useCollectionStore()
  const mouseHandler = useMemoizedFn((e: MouseEvent) => {
    if (e.type === 'pointerup') {
      setIsPressed(false)
    }
    if (e.type === 'pointerdown') {
      setIsPressed(true)
      sidebarDraggingItem = item
      sidebarDraggingParentCollectionId = parentCollectionId
      const cloned = draggableElementRef?.current?.cloneNode(true) as HTMLElement
      cloned.style.width = `${draggableElementRef?.current?.clientWidth}px`
      cloned.style.height = `${draggableElementRef?.current?.clientHeight}px`
      GlobalDragOverlayInstance.addDragElements?.(cloned)
    }
    if (e.type === 'pointermove') {
      if (isPressed) {
        GlobalDragOverlayInstance.startDrag?.()
        if (GlobalDragOverlayInstance) {
          switch (type) {
            case 'document': {
              GlobalDragOverlayInstance.draggingDetails = {
                type: 'pdf',
                pdfId: (item as IPdfDocument).id
              }
              break
            }
            case 'collection': {
              GlobalDragOverlayInstance.draggingDetails = {
                type: 'collection',
                collectionId: (item as ICollection).id
              }
              break
            }
            case 'note': {
              GlobalDragOverlayInstance.draggingDetails = {
                type: 'note',
                noteId: (item as INote).id
              }
            }
          }
        }
      }
    }
    if (e.type === 'pointerenter') {
      if (isDragging) {
        if (item !== sidebarDraggingItem) {
          setHovered(true)
        }
        const draggingEle = GlobalDragOverlayInstance.draggingDetails
        if (draggingEle) {
          let drop = false
          switch (draggingEle.type) {
            case 'pdf':
            case 'note':
              drop = true
              break
            case 'collection': {
              if (type === 'collection') {
                const myParentCollections = findParentCollections(item)
                if (myParentCollections.some(i => i.id === draggingEle.collectionId)) {
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
  const selfPointerUpHandler = useMemoizedFn((e: PointerEvent) => {
    setIsPressed(false)
    setHovered(false)
    if (sidebarDraggingItem === item) return
    if (!droppable) return
    if (type === 'collection' && item.id && sidebarDraggingParentCollectionId) {
      const draggingEle = GlobalDragOverlayInstance.draggingDetails
      GlobalDragOverlayInstance.draggingDetails = undefined
      console.log(draggingEle)
      if (draggingEle) {
        let canMoveItemsBetweenCollections = false
        switch (draggingEle.type) {
          case 'collection':
          case 'note':
          case 'pdf':
            canMoveItemsBetweenCollections = true
        }
        if (canMoveItemsBetweenCollections) {
          let collectionItem: ICollectionItem | undefined = undefined
          switch (draggingEle.type) {
            case 'note':
              collectionItem = {
                type: 'note',
                id: draggingEle.noteId
              }
              break
            case 'pdf':
              collectionItem = {
                type: 'document',
                id: draggingEle.pdfId
              }
              break
            case 'collection':
              collectionItem = {
                type: 'collection',
                id: draggingEle.collectionId
              }
          }
          if (collectionItem) {
            console.log(collectionItem, sidebarDraggingParentCollectionId, item.id)
            if (collectionItem.id === item.id) return
            moveItemBetweenCollections(collectionItem, sidebarDraggingParentCollectionId, item.id)
          }
        }
      }
    }
  })
  useEffect(() => {
    draggableElementRef?.current?.addEventListener('pointerdown', mouseHandler)
    draggableElementRef?.current?.addEventListener('pointermove', mouseHandler)
    draggableElementRef?.current?.addEventListener('pointerleave', mouseHandler)
    draggableElementRef?.current?.addEventListener('pointerenter', mouseHandler)
    draggableElementRef?.current?.addEventListener('pointerup', selfPointerUpHandler)
    document.addEventListener('pointerup', mouseHandler)
    return () => {
      draggableElementRef?.current?.removeEventListener('pointerdown', mouseHandler)
      draggableElementRef?.current?.removeEventListener('pointermove', mouseHandler)
      draggableElementRef?.current?.removeEventListener('pointerleave', mouseHandler)
      draggableElementRef?.current?.removeEventListener('pointerenter', mouseHandler)
      draggableElementRef?.current?.removeEventListener('pointerup', selfPointerUpHandler)
      document.removeEventListener('pointerup', mouseHandler)
    }
  })
  return {
    droppable,
    isDragging,
    hovered
  }
}

export default useSidebarItemDrag
