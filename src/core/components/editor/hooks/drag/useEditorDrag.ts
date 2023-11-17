import { AvaliableGlobalDraggingElements, GlobalDragOverlayInstance, useGlobalIsDragging } from '@/core'
import { GlobalEventHandler } from '@/events/globalEvent'
import { useMemoizedFn, useRafFn } from '@/hooks'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import { Editor, Path, Transforms } from 'slate'
import useDragIndicator from '../../components/useDragIndicator'
import DragManager from './DragManager'
import ScrollManager from '../../ScrollManager'
import { ReactEditor } from '../../slate-react'
import { BuiltInDraggableElement, CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import moveMultiElements from '../../utils/moveMultiElements'
import { ID_TO_ELEMENTS_MAP, ID_TO_PATH_MAP } from '../../weakMaps'
import useIsDragging from '../useIsDragging'
import { Rendevoz } from '@/core/rendevoz'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import useToggleDrag from '@/core/components/editor/hooks/drag/useToggleDrag'
import useDropToNoteElements from '@/core/components/editor/hooks/drag/useDropToNoteElements'
import useMoveElements from '@/core/components/editor/hooks/drag/useMoveElements'
import useReadOnlyEditor from '@/core/components/editor/hooks/useReadOnly'

export const normalizeEditorDragBlocksToGlobalDraggingDetails = async (instance: IEditorInstance) => {
  let normalizedGlobalDraggingDetails: Partial<AvaliableGlobalDraggingElements> = {}
  const editor = instance.getSlateEditor?.()
  if (!editor) return
  const selected = instance.values.selectedBlocks
  console.log(editor.on({ type: 'blockDragged' }))
  normalizedGlobalDraggingDetails = {
    type: 'noteBlock',
    element: editor.currentEnterElement,
    blockId: editor.currentEnterElement?.id,
    editorId: editor.id,
    path: ReactEditor.findPath(editor, editor.currentEnterElement),
    ...(await editor.on({ type: 'blockDragged' }))
  }
  console.log(normalizedGlobalDraggingDetails)
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
  const readonly = useReadOnlyEditor()
  // default is false
  const dragManager = useMemo(() => new DragManager(), [])
  const scrollManager = useMemo(() => new ScrollManager(), [])
  editor.dragManager = dragManager
  const preventLastMouseMoveRef = useRef(false)
  const { renderIndicator, indicatorManager } = useDragIndicator()
  const instance = useEditorInstance()
  const handleProcessDrop = useDropToNoteElements(instance, editor)
  const handleMoveElements = useMoveElements(instance, editor)

  const handleDrop = async (e: PointerEvent | DragEvent) => {
    // this process doesn't change editor's value
    const indicator = instance.values.indicator
    const { shouldAddElements, shouldMoveElements } = await handleProcessDrop(e)
    console.log(shouldAddElements, shouldMoveElements)
    // avoid adding elements and moving elements at the same time
    if (shouldMoveElements.length && shouldAddElements.length) return
    // this process change layout
    if (shouldAddElements.length && indicator) {
      const length = editor.children.length
      const entries = shouldAddElements.map((e, idx) => [e, [length + idx]])
      Transforms.insertNodes(editor, shouldAddElements, {
        at: [editor.children.length]
      })

      moveMultiElements({
        editor,
        currNodes: entries,
        targetPath: indicator.path,
        direction: indicator.direction,
        isNested: !!indicator.isNested
      })
    }
    if (shouldMoveElements.length) {
      handleMoveElements(shouldMoveElements)
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
    const targetPath = indicator?.path
    if (!targetPath) return

    const draggingElement = Rendevoz.Actions.State.Drag.getDraggingDetails() as BuiltInDraggableElement
    if (draggingElement.type === 'noteBlock') {
      if (editor.id === draggingElement.editorId) {
        const element = draggingElement.element
        const path = instance.getElementPathById?.(element.id)
        if (!path) return
        if (Path.isChild(targetPath, path)) {
          return
        }
      }

      if (draggingElement.element.type === 'synced' && e.target instanceof HTMLElement && e.target.closest('[data-spec-type="synced"]')) {
        if (indicator.element.type === 'synced' && (indicator.direction === 'top' || indicator.direction === 'bottom')) {
        } else {
          return
        }
      }
    }
    if (indicator) {
      if (indicator.element && indicator.path) {
        instance.values.indicator = indicator
      }

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
        handleDrop(event)
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
