import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { useEffect, useMemo, useState } from 'react'
import { Node } from 'slate'
import DragManager from '../DragManager'
import ScrollManager from '../ScrollManager'
import { CustomEditor } from '../types'
import useIsDragging from './useIsDragging'

const useEditorDrag = (editor: CustomEditor, scrollElement?: HTMLElement | null) => {
  const [isDragging, setIsDragging] = useIsDragging()
  const [globalIsDragging] = useGlobalIsDragging()
  // default is false
  const [isDraggingInsideCurrentEditor, setIsDraggingInsideCurrentEditor] = useState(false)
  const dragManager = useMemo(() => new DragManager(), [])
  const scrollManager = useMemo(() => new ScrollManager(), [])

  // previous not dragging inside this editor but now dragging inside, we need to set is dragging to true
  useEffect(() => {
    if (isDraggingInsideCurrentEditor === true) {
      // right now we are dragging from outside to inside
      setIsDragging(true)
    }
    // leaving this editor
    if (isDraggingInsideCurrentEditor === false) {
      setIsDragging(false)
    }
  }, [isDraggingInsideCurrentEditor])
  // when global is dragging is true, detect whether dragging inside this editor
  const crossTabDragDetector = useMemoizedFn((e: MouseEvent) => {
    console.log(e)
    if (e.type === 'mouseleave') {
      setIsDraggingInsideCurrentEditor(false)
    }
    if (e.type === 'mouseenter') {
      setIsDraggingInsideCurrentEditor(true)
    }
  })
  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    e.preventDefault()
    if (!isDragging) return
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
    dragManager.drop()
    scrollManager.endScroll()
    setIsDragging(false)
    setIsDraggingInsideCurrentEditor(false)
  })
  const throttledMouseMove = useRafFn(mouseMoveHandler)

  useEffect(() => {
    dragManager.registerEditor(editor)
  }, [editor])
  useEffect(() => {
    if (scrollElement) {
      dragManager.registerScrollElement(scrollElement)
      scrollManager.registerScrollElement(scrollElement)
    }
  })
  useEffect(() => {
    if (isDragging) {
      setIsDraggingInsideCurrentEditor(true)
      dragManager.prepareDragging()
      if (GlobalDragOverlayInstance && GlobalDragOverlayInstance.draggingDetails === undefined) {
        GlobalDragOverlayInstance.draggingDetails = {
          type: 'editorElement',
          noteId: editor.noteId,
          content: Node.string(editor.currentEnterElement),
          blockId: editor.currentEnterElement?.id
        }
      }
      document.addEventListener('mousemove', throttledMouseMove)
      document.addEventListener('mouseup', mouseUpHandler)
      return () => {
        document.removeEventListener('mouseup', mouseUpHandler)
        document.removeEventListener('mousemove', throttledMouseMove)
      }
    } else {
      dragManager.changeIndicator({ direction: null }, null)
    }
  }, [isDragging])

  // listen to global dragging state change
  useEffect(() => {
    if (globalIsDragging) {
      if (isDragging) {
        DragManager.globalDraggingEditor = editor
      }
      scrollElement?.addEventListener('mouseenter', crossTabDragDetector)
      scrollElement?.addEventListener('mouseleave', crossTabDragDetector)
      return () => {
        scrollElement?.removeEventListener('mouseenter', crossTabDragDetector)
        scrollElement?.removeEventListener('mouseleave', crossTabDragDetector)
      }
    }
  }, [globalIsDragging])
  return dragManager
}

export default useEditorDrag
