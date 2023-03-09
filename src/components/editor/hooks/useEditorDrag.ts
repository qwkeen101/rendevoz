import { GlobalDragOverlayInstance, useGlobalIsDragging } from '@/components/globalDragOverlay/GlobalDragOverlay'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn, useRafFn } from '@/hooks'
import Id from '@/utils/id'
import { useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Editor, Path, Transforms } from 'slate'
import { MetaObject } from '~/typings/data'
import useDragIndicator from '../components/useDragIndicator'
import DragManager from '../DragManager'
import ScrollManager from '../ScrollManager'
import { ReactEditor } from '../slate-react'
import { CustomEditor, CustomElement } from '../types'
import { HeadingElement } from '../types/commonElementTypes'
import { MetaObjectElement } from '../types/outerElementTypes'
import moveMultiElements from '../utils/moveMultiElements'
import moveSingleElement from '../utils/moveSingleElement'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP, SELECTED_BLOCKS_MAP } from '../weakMaps'
import useIsDragging from './useIsDragging'

const useEditorDrag = (editor: CustomEditor, scrollElement?: HTMLElement | null) => {
  const [isDraggingInsideEditor, setIsDragging] = useIsDragging()
  const [globalIsDragging] = useGlobalIsDragging()
  const emitter = useGlobalEventEmitter()
  const readonly = editor.readonly
  // default is false
  const dragManager = useMemo(() => new DragManager(), [])
  const scrollManager = useMemo(() => new ScrollManager(), [])

  const preventLastMouseMoveRef = useRef(false)
  const { renderIndicator, indicatorManager } = useDragIndicator()
  dragManager.onDrop = ({ direction, isNested, objectId, targetNodeId, shouldAddElements, shouldRemoveElements }) => {
    let targetPath = ID_TO_PATH_MAP.get(editor)?.get(targetNodeId)
    if (!targetPath) return
    const targetElement = Editor.node(editor, targetPath)[0] as CustomElement
    if (direction === 'bottom' && targetElement.type.startsWith('heading') && (targetElement as HeadingElement).folded === true) {
      const parentEle = Editor.node(editor, Path.parent(targetPath))[0]
      let currIdx = parentEle.children.findIndex(i => i === targetElement) + 1
      while (parentEle.children[currIdx] && parentEle.children[currIdx].hide === true) {
        targetPath = Path.next(targetPath)
        currIdx += 1
      }
    }
    // if generate a new column and target heading is folded, we need to get hided elements and move to that heading's under
    if (
      (direction === 'left' || direction === 'right') &&
      targetElement.type.startsWith('heading') &&
      (targetElement as HeadingElement).folded === true
    ) {
      const parentEle = Editor.node(editor, Path.parent(targetPath))[0]
      let currIdx = parentEle.children.findIndex(i => i === targetElement) + 1
      const shouldMoveIds: number[] = []
      while (parentEle.children[currIdx] && parentEle.children[currIdx].hide === true) {
        shouldMoveIds.push(parentEle.children[currIdx].id)
        currIdx += 1
      }
      // in the next macro task, we move to them
      setTimeout(() => {
        const entries = shouldMoveIds
          .map(id => {
            const path = ID_TO_PATH_MAP.get(editor)?.get(id)
            if (path) {
              const ele = Editor.node(editor, path)[0]
              if (ele) return [ele, path]
            }
          })
          .filter(i => i !== undefined)
        const currTargetPath = ID_TO_PATH_MAP.get(editor)?.get(targetNodeId)
        if (currTargetPath && entries) {
          moveMultiElements(editor, entries, currTargetPath, 'bottom', false)
        }
      })
    }
    // if we have objectId, it means need further process
    if (objectId && editor.noteId) {
      emitter
        .emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'editor',
              noteId: editor.noteId
            },
            draggingElement: GlobalDragOverlayInstance.draggingDetails
          }
        })
        .then(
          obj => {
            const metaObj = obj as MetaObject
            const editorNode: MetaObjectElement = {
              id: Id.getId(),
              type: 'metaObject',
              originId: metaObj.id,
              children: [{ text: '' }]
            }
            dragManager.insertNodeAtTargetPlace(editorNode, targetNodeId, direction, isNested)
          },
          () => {
            toast.error('Object creation was cancelled!')
          }
        )
      return
    }
    // this means we are dragging multiple blocks
    if (shouldAddElements && shouldRemoveElements && shouldAddElements === shouldRemoveElements) {
      const pathMap = ID_TO_PATH_MAP.get(editor)
      const entries = shouldAddElements
        .map(ele => (pathMap?.has(ele.id) ? [ele, pathMap.get(ele.id)] : undefined))
        .filter(i => i !== undefined)
      moveMultiElements(editor, entries, targetPath, direction, isNested)
      return
    }
    // drag from other components, just add
    if (shouldAddElements && !shouldRemoveElements) {
      const length = editor.children.length
      const entries = shouldAddElements.map((e, idx) => [e, [length + idx]])
      Transforms.insertNodes(editor, shouldAddElements, { at: [editor.children.length] })
      moveMultiElements(editor, entries, targetPath, direction, isNested)
      return
    }

    if (shouldAddElements && shouldRemoveElements && shouldAddElements[0] === shouldRemoveElements[0]) {
      const movedSingleElementPath = ID_TO_PATH_MAP.get(editor)?.get(shouldAddElements[0].id)
      if (movedSingleElementPath) {
        moveSingleElement(editor, movedSingleElementPath, targetPath, direction, isNested)
      }
    }
  }
  dragManager.eventEmitter = emitter
  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    e.preventDefault()
    if (scrollManager.isScrolling()) {
      scrollManager.endScroll()
    }
    if (scrollManager.canScroll()) {
      scrollManager.startScroll(e)
      dragManager.prepareDragging()
    }
    const indicator = dragManager.drag(e)
    if (indicator) {
      dragManager.changeIndicator(indicator)
      if (indicator.direction) {
        const indicatorPosition = ID_TO_ELEMENTS_MAP.get(editor)?.get(indicator.id)?.getIndicatorPosition(indicator.direction)

        if (indicatorPosition && !preventLastMouseMoveRef.current) {
          indicatorManager.setIndicatorState({ ...indicatorPosition, visible: true, nested: indicator.isNested })
        }
      }
    }
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
      dragManager.prepareDragging()
      console.log('true set')
      GlobalDragOverlayInstance.startDrag?.()
      if (GlobalDragOverlayInstance.draggingDetails === undefined) {
        const selected = SELECTED_BLOCKS_MAP.get(editor)
        GlobalDragOverlayInstance.draggingDetails = {
          type: 'noteElement',
          element: editor.currentEnterElement,
          noteId: editor.noteId,
          blockId: editor.currentEnterElement?.id,
          editorId: editor.id,
          path: ReactEditor.findPath(editor, editor.currentEnterElement)
        }
        if (editor.currentEnterElement?.type === 'metaObject' && !(selected && selected.size > 0)) {
          GlobalDragOverlayInstance.draggingDetails.metaId = editor.currentEnterElement.originId
        }
        if (selected && selected.size > 0) {
          const keys = selected.keys()
          const eleMap = ID_TO_ELEMENTS_MAP.get(editor)
          const elements = Array.from(keys)
            .map(key => eleMap?.get(key)?.getElement())
            .filter(i => i !== undefined) as CustomElement[]
          GlobalDragOverlayInstance.draggingDetails.elements = elements
        }
        // right now we need to get elements hided by this heading and move together
        if (GlobalDragOverlayInstance.draggingDetails.element?.type.startsWith('heading')) {
          const headingEle = editor.currentEnterElement
          const parentEle = Editor.node(editor, Path.parent(ID_TO_PATH_MAP.get(editor)?.get(headingEle?.id)))[0] as CustomElement
          let headingEleIdx = parentEle.children.findIndex(i => i === headingEle) + 1
          console.log(parentEle, headingEleIdx)
          const elements = [headingEle]
          while (parentEle.children[headingEleIdx] && parentEle.children[headingEleIdx].hide === true) {
            elements.push(parentEle.children[headingEleIdx])
            headingEleIdx += 1
          }
          GlobalDragOverlayInstance.draggingDetails.elements = elements.filter(i => i !== undefined) as CustomElement[]
          console.log(GlobalDragOverlayInstance.draggingDetails)
        }
      }
    } else {
      indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    }
  }, [isDraggingInsideEditor])

  // listen to global dragging state change
  useEffect(() => {
    if (readonly) return
    if (globalIsDragging) {
      preventLastMouseMoveRef.current = false
      scrollElement?.addEventListener('mousemove', realMouseMoveHandler)
      if (isDraggingInsideEditor) {
        DragManager.globalDraggingEditor = editor
      }
      return () => {
        scrollElement?.removeEventListener('mousemove', realMouseMoveHandler)
      }
    } else {
      DragManager.dragElementsAdded = false
      setIsDragging(false)
    }
  }, [globalIsDragging])

  useEffect(() => {
    const globalEventHandler = new GlobalEventHandler()
    globalEventHandler.on('globalDragPointerUp', ({ event }) => {
      preventLastMouseMoveRef.current = true
      if (scrollElement?.contains(event.target as HTMLElement)) {
        dragManager.drop()
      }
      scrollElement?.removeEventListener('mousemove', realMouseMoveHandler)
      scrollManager.endScroll()
      setIsDragging(false)
      indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    })
    emitter.addListener('global', globalEventHandler)
    return () => {
      emitter.removeListener('global', globalEventHandler)
    }
  })
  return { dragManager, renderIndicator }
}

export default useEditorDrag
