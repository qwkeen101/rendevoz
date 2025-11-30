import { useGlobalIsDragging, Global } from '../../global'
import { useAutoScroll, useMemoizedFn, useRafFn } from '@/hooks'
import { useEffect, useRef } from 'react'
import { Path, Transforms } from 'slate'
import useDragIndicator from '../../components/useDragIndicator'
import { ReactEditor } from '../../slate-react'
import { BuiltInDraggableElement, CustomEditor, CustomElement, IEditorInstance, IGlobalEvents } from '~/typings'
import moveMultiElements from '../../utils/moveMultiElements'
import useIsDragging from '../useIsDragging'
import useEditorInstance from '../hooks/useEditorInstance'
import useDropToNoteElements from '../hooks/drag/useDropToNoteElements'
import useMoveElements from '../hooks/drag/useMoveElements'
import useReadOnlyEditor from '../hooks/useReadOnly'
import dragInColumnLike from '../hooks/drag/indicator/dragInColumnLike'

export const normalizeEditorDragBlocksToGlobalDraggingDetails = async (
  instance: IEditorInstance
): Promise<
  BuiltInDraggableElement & {
    type: 'noteBlock'
  }
> => {
  let normalizedGlobalDraggingDetails: Partial<BuiltInDraggableElement> & { type: 'noteBlock' } = {
    type: 'noteBlock'
  }
  const editor = instance.getSlateEditor()
  const dragElement = editor.currentEnterElement
  const selected = instance.values.selectedBlocks
  const elements = (selected.size > 0 ? Array.from(selected.values().map(i => i.element)) : [dragElement]).filter(i => i) as CustomElement[]
  if (!elements.length || !dragElement) return Promise.reject()
  const extended = (instance.toggleOps?.extendElements(elements) || []).filter(i => !['column', 'columnList'].includes(i[0].type))
  // sort by paths
  extended.sort((b, a) => {
    return Path.isBefore(b[1], a[1]) ? -1 : 1
  })
  normalizedGlobalDraggingDetails = {
    type: 'noteBlock',
    element: dragElement,
    elements: extended.map(i => i[0]),
    blockId: dragElement.id,
    editorId: editor.id,
    path: ReactEditor.findPath(editor, dragElement)
  }
  if (dragElement.type === 'metaObject' && !(selected.size > 0)) {
    normalizedGlobalDraggingDetails.metaId = dragElement.originId
  }
  return normalizedGlobalDraggingDetails
}
const useEditorDrag = (editor: CustomEditor, scrollElement?: HTMLElement | null) => {
  const [isDraggingInsideEditor, setIsDragging] = useIsDragging()
  const [globalIsDragging, setGlobalIsDragging] = useGlobalIsDragging()
  const readonly = useReadOnlyEditor()
  const preventLastMouseMoveRef = useRef(false)
  const { renderIndicator, indicatorManager } = useDragIndicator()
  const instance = useEditorInstance()
  const startScroll = useAutoScroll({
    scrollElementRef: instance.values.scrollElementRef
  })
  const handleProcessDrop = useDropToNoteElements(instance, editor)
  const handleMoveElements = useMoveElements(instance, editor)

  const handleDrop = async (e: PointerEvent | DragEvent) => {
    // this process doesn't change editor's value
    const indicator = instance.values.indicator
    const res = await handleProcessDrop(e)
    if (!res) return
    const { shouldAddElements, shouldMoveElements } = res
    // avoid adding elements and moving elements at the same time
    if (shouldMoveElements?.length && shouldAddElements.length) return
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
    if (shouldMoveElements?.length) {
      handleMoveElements(shouldMoveElements)
    }
  }

  const mouseMoveHandler = useMemoizedFn((e: PointerEvent | DragEvent) => {
    if (!scrollElement) return
    if (!(e.target instanceof HTMLElement) || !scrollElement.contains(e.target)) {
      if (isDraggingInsideEditor) {
        setIsDragging(false)
      }
      return
    }
    if (readonly) return
    if (!isDraggingInsideEditor) {
      setIsDragging(true)
      setGlobalIsDragging(true)
    }
    startScroll.run(e as PointerEvent)
    const editorNode = ReactEditor.toDOMNode(editor, editor)
    const indicator = dragInColumnLike(e, editorNode, { instance, editor })
    const targetPath = indicator?.path
    console.log(targetPath)
    if (!targetPath) return

    const draggingElement = Global.values.draggingDetails
    if (!draggingElement && !(e && e instanceof DragEvent)) return
    if (draggingElement?.type === 'noteBlock') {
      if (editor.id === draggingElement.editorId) {
        const element = draggingElement.element
        const path = instance.getElementPathById?.(element.id)
        if (!path) return
        if (Path.isChild(targetPath, path)) {
          return
        }
      }
      // disable drag sync into sync
      if (draggingElement.element.type === 'synced' && e.target instanceof HTMLElement && e.target.closest('[data-spec-type="synced"]')) {
        return
      }
    }
    if (indicator) {
      if (indicator.element && indicator.path) {
        instance.values.indicator = indicator
      }

      if (indicator.direction) {
        const indicatorPosition = instance.blockOps?.getBlockFuncs(indicator.id)?.getIndicatorPosition(indicator.direction)
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

  const throttledMouseMove = useRafFn(mouseMoveHandler)
  const handleDragMove = (e: IGlobalEvents['dragMove']) => {
    const { event } = e
    throttledMouseMove(event)
  }
  useEffect(() => {
    if (scrollElement) {
      Global.addEventListener('dragEnd', handleDragEnd)
      Global.addEventListener('dragMove', handleDragMove)
      return () => {
        Global.removeEventListener('dragMove', handleDragMove)
        Global.removeEventListener('dragEnd', handleDragEnd)
      }
    }
  })

  useEffect(() => {
    if (!isDraggingInsideEditor) {
      indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    }
  }, [isDraggingInsideEditor])

  // listen to global dragging state change
  useEffect(() => {
    if (globalIsDragging) {
      if (readonly) return
      preventLastMouseMoveRef.current = false
      const textBox = scrollElement?.querySelector('[role="textbox"]') as HTMLElement | undefined
      if (textBox) {
        textBox.style.pointerEvents = 'none'
      }
      return () => {
        if (textBox) {
          textBox.style.pointerEvents = 'auto'
        }
      }
    } else {
      setIsDragging(false)
    }
  }, [globalIsDragging])
  const handleDragEnd = ({ event }: IGlobalEvents['dragEnd']) => {
    preventLastMouseMoveRef.current = true
    if (scrollElement?.contains(event.target as HTMLElement)) {
      handleDrop(event)
    }
    startScroll.end()
    setIsDragging(false)
    indicatorManager.setIndicatorState(s => ({ ...s, visible: false }))
    setGlobalIsDragging(false)
  }

  return { renderIndicator }
}

export default useEditorDrag
