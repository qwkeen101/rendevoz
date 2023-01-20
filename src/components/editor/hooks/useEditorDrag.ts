import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import useEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { useEffect, useMemo, useRef } from 'react'
import DragManager from '../DragManager'
import ScrollManager from '../ScrollManager'
import { CustomEditor, CustomElement } from '../types'
import { ID_TO_ELEMENTS_MAP, SELECTED_BLOCKS_MAP } from '../weakMaps'
import useIsDragging from './useIsDragging'

const useEditorDrag = (editor: CustomEditor, scrollElement?: HTMLElement | null) => {
  const [isDraggingInsideEditor, setIsDragging] = useIsDragging()
  const [globalIsDragging] = useGlobalIsDragging()
  const emitter = useEventEmitter()
  const readonly = editor.readonly
  const draggingRef = useRef(false)
  // default is false
  const dragManager = useMemo(() => new DragManager(), [])
  const scrollManager = useMemo(() => new ScrollManager(), [])
  dragManager.onDrop = e => {
    emitter.emit('global', {
      type: 'dragDrop',
      data: {
        dropOn: 'editor',
        dragElement: e,
        noteId: editor.noteId,
        note: editor.note
      }
    })
  }
  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    if (!draggingRef.current) return
    e.preventDefault()
    if (scrollManager.isScrolling()) {
      scrollManager.endScroll()
    }
    if (scrollManager.canScroll()) {
      scrollManager.startScroll(e)
      dragManager.prepareDragging()
    }
    const indicator = dragManager.drag(e)
    indicator && dragManager.changeIndicator(indicator, e)
  })
  const mouseUpHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    dragManager.drop()
    scrollManager.endScroll()
    setIsDragging(false)
  })
  const throttledMouseMove = useRafFn(mouseMoveHandler)
  const realMouseMoveHandler = (e: MouseEvent) => {
    e.preventDefault()
    throttledMouseMove(e)
  }
  useEffect(() => {
    dragManager.registerEditor(editor)
  }, [editor])
  useEffect(() => {
    if (scrollElement) {
      dragManager.registerScrollElement(scrollElement)
      scrollManager.registerScrollElement(scrollElement)
      scrollElement.addEventListener('pointerleave', pointerLeaveAndEnterHandler)
      scrollElement.addEventListener('pointerenter', pointerLeaveAndEnterHandler)
      return () => {
        scrollElement.removeEventListener('pointerleave', pointerLeaveAndEnterHandler)
        scrollElement.removeEventListener('pointerenter', pointerLeaveAndEnterHandler)
      }
    }
  })
  const pointerLeaveAndEnterHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerleave') {
      setIsDragging(false)
      draggingRef.current = false
    }
    if (e.type === 'pointerenter') {
      if (globalIsDragging) {
        setIsDragging(true)
      }
    }
  })
  useEffect(() => {
    if (readonly) return
    if (isDraggingInsideEditor) {
      draggingRef.current = true
      dragManager.prepareDragging()
      document.addEventListener('mousemove', realMouseMoveHandler)
      document.addEventListener('mouseup', mouseUpHandler)

      if (GlobalDragOverlayInstance.draggingDetails === undefined) {
        const selected = SELECTED_BLOCKS_MAP.get(editor)
        GlobalDragOverlayInstance.draggingDetails = {
          type: 'noteElement',
          element: editor.currentEnterElement,
          noteId: editor.noteId,
          blockId: editor.currentEnterElement?.id
        }
        if (selected && selected.size > 0) {
          const keys = selected.keys()
          const eleMap = ID_TO_ELEMENTS_MAP.get(editor)
          const elements = Array.from(keys)
            .map(key => eleMap?.get(key)?.getElement())
            .filter(i => i !== undefined) as CustomElement[]
          GlobalDragOverlayInstance.draggingDetails.elements = elements
        }
      }
      return () => {
        document.removeEventListener('mouseup', mouseUpHandler)
        document.removeEventListener('mousemove', realMouseMoveHandler)
      }
    } else {
      draggingRef.current = false
      dragManager.changeIndicator({ direction: null }, null)
    }
  }, [isDraggingInsideEditor])

  // listen to global dragging state change
  useEffect(() => {
    console.log(globalIsDragging)
    if (readonly) return
    if (globalIsDragging) {
      if (isDraggingInsideEditor) {
        DragManager.globalDraggingEditor = editor
      }
    } else {
      DragManager.dragElementsAdded = false
      setIsDragging(false)
    }
  }, [globalIsDragging])
  return dragManager
}

export default useEditorDrag
