import { AvaliableGlobalDraggingElements, getSetting, GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useMemoizedFn, useRafFn } from '@/hooks'
import Id from '@/utils/id'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { toast } from 'react-hot-toast'
import { Editor, Path, Transforms } from 'slate'
import { MetaObject } from '~/typings/data'
import useDragIndicator from '../components/useDragIndicator'
import DragManager from './DragManager'
import ScrollManager from '../ScrollManager'
import { ReactEditor } from '../slate-react'
import { CustomEditor, CustomElement, HeadingElement, IEditorInstance, MetaObjectElement } from '~/typings'
import moveMultiElements from '../utils/moveMultiElements'
import moveSingleElement from '../utils/moveSingleElement'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP } from '../weakMaps'
import useIsDragging from './useIsDragging'
import { Rendevoz } from '@/core/rendevoz'
import useEditorInstance from '@/core/editor/hooks/useEditorInstance'

export const normalizeEditorDragBlocksToGlobalDraggingDetails = (instance: IEditorInstance) => {
  let normalizedGlobalDraggingDetails: Partial<AvaliableGlobalDraggingElements> = {}
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const selected = instance.values.selectedBlocks
  normalizedGlobalDraggingDetails = {
    type: 'noteBlock',
    element: editor.currentEnterElement,
    noteId: editor.noteId,
    blockId: editor.currentEnterElement?.id,
    editorId: editor.id,
    path: ReactEditor.findPath(editor, editor.currentEnterElement)
  }
  if (editor.currentEnterElement?.type === 'metaObject' && !(selected.size > 0)) {
    normalizedGlobalDraggingDetails.metaId = editor.currentEnterElement.originId
  }
  if (selected.size > 0) {
    const elements = Array.from(selected.values())
      .map(i => i.element)
      .filter(i => i.type !== 'column' && i.type !== 'columnList')
    normalizedGlobalDraggingDetails.elements = elements
  }
  if (normalizedGlobalDraggingDetails.elements?.length) {
    normalizedGlobalDraggingDetails.elements.forEach((i, idx) => {
      if (i.type.startsWith('heading')) {
        const normalized = normalizeHeadingToHeadingWithHidenElements(i, editor)
        // remove first
        normalized.shift()
        normalizedGlobalDraggingDetails.elements.splice(idx, 0, ...normalized)
      }
    })
  } else {
    // right now we need to get elements hided by this heading and move together
    if (normalizedGlobalDraggingDetails.element?.type.startsWith('heading')) {
      const headingEle = editor.currentEnterElement
      if (headingEle) {
        const elements = normalizeHeadingToHeadingWithHidenElements(headingEle, editor)
        normalizedGlobalDraggingDetails.elements = elements.filter(i => i !== undefined) as CustomElement[]
      }
    }
  }

  return normalizedGlobalDraggingDetails
}

const normalizeHeadingToHeadingWithHidenElements = (element: CustomElement, editor: CustomEditor) => {
  const parentEle = Editor.node(editor, Path.parent(ID_TO_PATH_MAP.get(editor)?.get(element?.id)))[0] as CustomElement
  let headingEleIdx = parentEle.children.findIndex(i => i === element) + 1
  const elements = [element]
  while (parentEle.children[headingEleIdx] && parentEle.children[headingEleIdx].hide === true) {
    elements.push(parentEle.children[headingEleIdx])
    headingEleIdx += 1
  }
  return elements
}

const useEditorDrag = (editor: CustomEditor, scrollElement?: HTMLElement | null) => {
  const [isDraggingInsideEditor, setIsDragging] = useIsDragging()
  const [globalIsDragging] = useGlobalIsDragging()
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const readonly = editor.readonly
  // default is false
  const dragManager = useMemo(() => new DragManager(), [])
  const scrollManager = useMemo(() => new ScrollManager(), [])
  editor.dragManager = dragManager
  const preventLastMouseMoveRef = useRef(false)
  const { renderIndicator, indicatorManager } = useDragIndicator()
  const instance = useEditorInstance()
  dragManager.onDrop = ({ direction, isNested, objectId, targetNodeId, shouldAddElements, shouldRemoveElements, event }) => {
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
    // if we have objectId or drop event, it means need further process
    if ((objectId || event) && editor.noteId) {
      emitter
        .emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'editor',
              noteId: editor.noteId
            },
            draggingElement: GlobalDragOverlayInstance.draggingDetails,
            e: event
          }
        })
        .then(
          obj => {
            const metaObj = obj as MetaObject
            const setting = getSetting()
            console.log(metaObj)
            if (setting.editor.objectAutoBecomeInline) {
              const editorNode: CustomElement = {
                id: Id.getId(),
                type: 'paragraph',
                children: [
                  {
                    type: 'inline-metaObject',
                    originId: metaObj.id,
                    children: [{ text: '' }],
                    id: Id.getId()
                  }
                ]
              }
              dragManager.insertNodeAtTargetPlace(editorNode, targetNodeId, direction, isNested)
              return
            }
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
      Transforms.insertNodes(editor, shouldAddElements, {
        at: [editor.children.length]
      })
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
  dragManager.onIndicatorChange = indicator => {
    dragManager.changeIndicator(indicator)
    if (indicator.direction) {
      const indicatorPosition = ID_TO_ELEMENTS_MAP.get(editor)?.get(indicator.id)?.getIndicatorPosition(indicator.direction)

      if (indicatorPosition && !preventLastMouseMoveRef.current) {
        indicatorManager.setIndicatorState({
          ...indicatorPosition,
          visible: true,
          nested: indicator.isNested
        })
      }
    }
  }
  dragManager.eventEmitter = emitter

  const mouseMoveHandler = useMemoizedFn((e: MouseEvent) => {
    if (readonly) return
    if (!isDraggingInsideEditor) {
      setIsDragging(true)
    }
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
          indicatorManager.setIndicatorState({
            ...indicatorPosition,
            visible: true,
            nested: indicator.isNested
          })
        }
      }
    }
  })

  const dropHandler = useMemoizedFn((e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  })
  const throttledMouseMove = useRafFn(mouseMoveHandler)
  const realMouseMoveHandler = useCallback((e: MouseEvent) => {
    e.preventDefault()
    throttledMouseMove(e)
  }, [])
  useEffect(() => {
    dragManager.registerEditor(editor)
  }, [editor])
  useEffect(() => {
    if (scrollElement) {
      dragManager.registerScrollElement(scrollElement)
      scrollManager.registerScrollElement(scrollElement)
      scrollElement.addEventListener('pointerleave', pointerLeaveAndEnterHandler)
      scrollElement.addEventListener('pointerenter', pointerLeaveAndEnterHandler)
      scrollElement.addEventListener('drop', dropHandler, true)
      scrollElement.addEventListener('dragover', realMouseMoveHandler, true)
      return () => {
        scrollElement.removeEventListener('pointerleave', pointerLeaveAndEnterHandler)
        scrollElement.removeEventListener('pointerenter', pointerLeaveAndEnterHandler)
        scrollElement.removeEventListener('drag', dropHandler, true)
        scrollElement.removeEventListener('dragover', realMouseMoveHandler, true)
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
    if (isDraggingInsideEditor && editor.currentEnterElement) {
      dragManager.prepareDragging()

      if (GlobalDragOverlayInstance.draggingDetails === undefined) {
        const normalized = normalizeEditorDragBlocksToGlobalDraggingDetails(instance)
        Rendevoz.Actions.State.Drag.setDraggingDetails(normalized)
      }
    } else {
      indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    }
  }, [isDraggingInsideEditor])

  // listen to global dragging state change
  useEffect(() => {
    if (readonly) return
    if (globalIsDragging) {
      dragManager.prepareDragging()
      preventLastMouseMoveRef.current = false
      scrollElement?.addEventListener('pointermove', realMouseMoveHandler)
      const textBox = scrollElement?.querySelector('[role="textbox"]') as HTMLElement | undefined
      if (textBox) {
        textBox.style.pointerEvents = 'none'
      }

      return () => {
        scrollElement?.removeEventListener('pointermove', realMouseMoveHandler)
        if (textBox) {
          textBox.style.pointerEvents = 'auto'
        }
      }
    } else {
      setIsDragging(false)
    }
  }, [globalIsDragging])

  useEffect(() => {
    const globalEventHandler = new GlobalEventHandler()
    globalEventHandler.on('globalDragPointerUp', ({ event }) => {
      preventLastMouseMoveRef.current = true
      if (scrollElement?.contains(event.target as HTMLElement)) {
        dragManager.drop(event)
      }
      scrollManager.endScroll()
      setIsDragging(false)
      indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    })
    emitter.addListener('global', globalEventHandler)
    return () => {
      emitter.removeListener('global', globalEventHandler)
    }
  }, [scrollElement])

  return { dragManager, renderIndicator }
}

export default useEditorDrag
