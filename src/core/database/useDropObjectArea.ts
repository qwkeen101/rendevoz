import { useEventHandler } from '@/events'
import { useRafFn } from '@/hooks'
import { RefObject, useEffect } from 'react'
import { GlobalDraggingDetails } from '~/typings'
import { Rendevoz } from '../rendevoz'

const useDropObjectArea = (
  dropArea: RefObject<HTMLElement> | HTMLElement,
  callback?: {
    onDragLeave?: () => void
    onDragOver?: (element: GlobalDraggingDetails) => void
    onDrop?: (element: GlobalDraggingDetails) => void
  }
) => {
  const handler = useEventHandler('global')
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const rafCheck = useRafFn((e: PointerEvent | DragEvent, draggingElement: GlobalDraggingDetails) => {
    const area = (dropArea instanceof HTMLElement ? dropArea : dropArea.current)!
    if (e.target instanceof Element && area.contains(e.target)) {
      callback?.onDragOver?.(draggingElement)
    } else {
      callback?.onDragLeave?.()
    }
  })
  handler.on('globalDragPointerUp', data => {
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
}

export default useDropObjectArea
