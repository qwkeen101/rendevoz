import { useRafFn } from '@/hooks'
import { RefObject, useEffect, useRef, useState } from 'react'
import { useGlobalIsDragging } from '@/core'
import { MetaStore } from '@/api/stores'
import { IGlobalEvents, IDraggableElement } from '~/typings'

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
  const [canDropAsMeta, setCanDropAsMeta] = useState<{
    droppable: boolean
    metaId?: number[]
  }>({
    droppable: true
  })
  const [isDragOver, setIsDragOver] = useState(false)
  const [isDragging] = useGlobalIsDragging()
  const rafCheck = useRafFn((e: PointerEvent | DragEvent, draggingElement: IDraggableElement) => {
    if (!startDragRef.current) return
    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (!e) return
    if (area?.contains(e.target)) {
      let droppable = false
      const draggingEle = Global.values.draggingDetails
      let metaId: number[] | undefined = undefined
      if (draggingEle) {
        if (draggingEle.type === 'groupItem') {
          if (draggingEle.value.length) {
            const meta = draggingEle.value.filter(i => i.type === 'metaObject').map(i => i.id)
            if (meta.length) {
              metaId = meta
            }
          }
        }
        if (draggingEle.type === 'metaObjects') {
          metaId = draggingEle.ids
          droppable = true
        }
        setCanDropAsMeta({
          droppable,
          metaId
        })
      }
      setIsDragOver(true)
      callback?.onDragOver?.(draggingElement)
    } else {
      if (isDragOver) {
        callback?.onDragLeave?.()
        setIsDragOver(false)
      }
    }
  })
  const handleDragEnd = (data: IGlobalEvents['dragEnd']) => {
    startDragRef.current = false
    const draggingDetails = Global.values.draggingDetails
    setTimeout(() => {
      setIsDragOver(false)
    })
    setTimeout(() => {
      setCanDropAsMeta({
        droppable: false
      })
    }, 500)
    if (draggingDetails) {
      callback?.onDragEnd?.(draggingDetails)
      const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
      if (area) {
        const { event } = data
        if (event.target instanceof Element && area.contains(event.target)) {
          callback?.onDrop?.(draggingDetails)
        }
      }
    }
  }
  const handleDragMove = (data: IGlobalEvents['dragMove']) => {
    const details = Global.values.draggingDetails
    if (!startDragRef.current && details) {
      callback?.onDragStart?.(details)
      startDragRef.current = true
    }

    const area = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (area) {
      rafCheck(data.event, details)
    }
  }
  const pointerUpHandler = () => {
    if (isDragOver) {
      setIsDragOver(false)
    }
  }
  useEffect(() => {
    const ele = dropArea instanceof HTMLElement ? dropArea : dropArea.current
    if (ele) {
      ele.addEventListener('pointerup', pointerUpHandler)
      Global.addEventListener('dragEnd', handleDragEnd)
      Global.addEventListener('dragMove', handleDragMove)
    }
    return () => {
      ele?.removeEventListener('pointerup', pointerUpHandler)
      Global.removeEventListener('dragEnd', handleDragEnd)
      Global.removeEventListener('dragMove', handleDragMove)
    }
  })
  useEffect(() => {
    rafCheck()
  }, [isDragging])
  return {
    isDragging,
    canDropAsMeta,
    isDragOver
  }
}

export default useDropObjectArea
