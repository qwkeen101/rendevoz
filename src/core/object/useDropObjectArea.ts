import { useEventHandler } from '@/events'
import { useRafFn } from '@/hooks'
import { RefObject, useEffect, useRef, useState } from 'react'
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
    onDragStart?: (element: IDraggableElement) => void
    onDragEnd?: (element: IDraggableElement) => void
  }
) => {
  const startDragRef = useRef(false)
  const handler = useEventHandler('global')
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const [canDropAsMeta, setCanDropAsMeta] = useState<{
    droppable: boolean
    existed: boolean
    metaId?: number
  }>({
    droppable: true,
    existed: false
  })
  const [isDragging] = useGlobalIsDragging()
  const rafCheck = useRafFn((e: PointerEvent | DragEvent, draggingElement: IDraggableElement) => {
    if(!startDragRef.current) return
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    console.log(area, draggingElement)
    let droppable = false
    const draggingEle = Rendevoz.Actions.State.Drag.getDraggingDetails()
    const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
    let objectId: number | undefined = undefined
    let alreadyExist = false
    let metaId: number | undefined = undefined
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
      if (objectId && objectIdToMetaObjectIdMap?.has(objectId)) {
        alreadyExist = true
        metaId = objectIdToMetaObjectIdMap?.get(objectId)
      }
      if (draggingEle.type === 'metaElement') {
        alreadyExist = true
        metaId = draggingEle.metaId
      }
      setCanDropAsMeta({
        droppable,
        existed: alreadyExist,
        metaId
      })
    }
    if (!e) return
    if (area?.contains(e.target)) {
      callback?.onDragOver?.(draggingElement)
    } else {
      callback?.onDragLeave?.()
    }
  })
  handler.on('globalDragPointerUp', data => {
    startDragRef.current = false
    setTimeout(() => {
      setCanDropAsMeta({
        droppable: false,
        existed: false
      })
    }, 500)
    callback?.onDragEnd?.(data.draggingElement)
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (area) {
      const { event } = data
      if (event.target instanceof Element && area.contains(event.target)) {
        callback?.onDrop?.(data.draggingElement)
      }
    }
  })
  handler.on('globalDragPointerMove', data => {
    if (!startDragRef.current && data.draggingElement) {
      callback?.onDragStart?.(data.draggingElement)
      startDragRef.current = true
    }

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
