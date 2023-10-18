import { useEventHandler } from '@/events'
import { useRafFn } from '@/hooks'
import { RefObject, useEffect, useState } from 'react'
import { IDraggableElement } from 'rendevoz/typings/globalInstances/dragDrop'
import { Rendevoz } from '../rendevoz'
import { useGlobalIsDragging } from '@/core'
import { globalStore } from '@/stores'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { TypeToRegisteredObject } from '@/stores/object.store'

const useDropObjectArea = (
  dropArea: RefObject<HTMLElement> | HTMLElement,
  callback?: {
    onDragLeave?: () => void
    onDragOver?: (element: IDraggableElement) => void
    onDrop?: (element: IDraggableElement) => void
  }
) => {
  const handler = useEventHandler('global')
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const [canDropAsMeta, setCanDropAsMeta] = useState<{
    droppable: boolean
    existed: boolean
  }>({
    droppable: true,
    existed: false
  })
  const [isDragging] = useGlobalIsDragging()
  const rafCheck = useRafFn((e: PointerEvent | DragEvent, draggingElement: IDraggableElement) => {
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    let droppable = false
    const draggingEle = Rendevoz.Actions.State.Drag.getDraggingDetails()
    const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
    let objectId: number | undefined = undefined
    let alreadyExist = false
    if (draggingEle) {
      if (draggingEle.type && TypeToRegisteredObject.has(draggingEle.type)) {
        const { getObjectIdFromDraggingEle } = TypeToRegisteredObject.get(draggingEle.type)!
        objectId = getObjectIdFromDraggingEle?.(draggingEle)
      }
      switch (draggingEle.type) {
        case 'noteBlock':
          objectId = draggingEle.blockId
          break
        case 'noteLabel':
        case 'videoLabel':
        case 'audioLabel':
        case 'pdfLabel':
        case 'webpageLabel':
          objectId = draggingEle.labelId
          break
        case 'pdf':
          objectId = draggingEle.pdfId
          break
        case 'note':
          objectId = draggingEle.noteId
          break
        case 'whiteboard':
          objectId = draggingEle.whiteboardId
          break
        case 'image':
          droppable = true
          break
        default:
          droppable = false
      }
      if (objectId !== undefined && !objectIdToMetaObjectIdMap?.has(objectId)) droppable = true
      if ((objectId && objectIdToMetaObjectIdMap?.has(objectId)) || draggingEle.type === 'metaElement') alreadyExist = true
      setCanDropAsMeta({
        droppable,
        existed: alreadyExist
      })
    }
    if (!e) return
    if (area?.contains(e.target)) {
      console.log('checking')

      callback?.onDragOver?.(draggingElement)
    } else {
      callback?.onDragLeave?.()
    }
  })
  handler.on('globalDragPointerUp', data => {
    setTimeout(() => {
      setCanDropAsMeta({
        droppable: false,
        existed: false
      })
    }, 500)
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (area) {
      const { event } = data
      if (event.target instanceof Element && area.contains(event.target)) {
        callback?.onDrop?.(data.draggingElement)
      }
    }
  })
  handler.on('globalDragPointerMove', data => {
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (area) {
      const { event, draggingElement } = data
      rafCheck(event, draggingElement)
    }
  })
  useEffect(() => {
    emitter.addListener('global', handler)
    return () => {
      emitter.removeListener('global', handler)
    }
  })
  useEffect(() => {
    rafCheck()
  }, [isDragging])
  return {
    isDragging,
    canDropAsMeta
  }
}

export default useDropObjectArea
