import { BuiltInDraggableElement, CustomEditor, IEditorInstance } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import useDragCreateSyncBlock from '@/core/editor/hooks/drag/useDragCreateSyncBlock'
/**
 * 拖拽到笔记上到元素可能是笔记块或者其他元素，分情况处理
 * 还会遇到带有隐藏到元素的，比如折叠等
 * shouldAddElements, shouldMoveElements
 */

const useDropToNoteElements = (instance: IEditorInstance, editor: CustomEditor) => {
  const toggleOps = instance.toggleOps
  useDragCreateSyncBlock(instance, editor)
  const processDrop = async (e: PointerEvent | DragEvent) => {
    const result = e instanceof PointerEvent ? await handlePointerDrop(e) : await handleDragDrop(e)
    return result
  }

  const handlePointerDrop = async (e: PointerEvent) => {
    const draggingElement = Rendevoz.Actions.State.Drag.getDraggingDetails() as BuiltInDraggableElement | undefined
    if (!draggingElement) return
    // first check whether controlled by outside
    const normalizedEditorBlock = await editor.on({
      type: 'drop',
      event: e,
      draggingElement
    })
    console.log(normalizedEditorBlock)
    if (normalizedEditorBlock) {
      if (Array.isArray(normalizedEditorBlock)) {
        return {
          shouldAddElements: normalizedEditorBlock,
          shouldMoveElements: []
        }
      } else {
        return {
          shouldAddElements: [normalizedEditorBlock],
          shouldMoveElements: []
        }
      }
    }
    if (draggingElement.type === 'noteBlock') {
      if (!draggingElement.element && !draggingElement.elements) return
      // 1.移动笔记内的块
      const arrayDragElements = draggingElement.elements?.length ? [...draggingElement.elements] : [draggingElement.element]
      // 添加被折叠的块到拖拽中
      const normalizedElements = toggleOps?.extendElements(arrayDragElements).map(i => i[0])
      return {
        shouldMoveElements: normalizedElements,
        shouldAddElements: []
      }
    }
  }

  const handleDragDrop = async (e: DragEvent) => {
    const normalized = await editor.on({
      type: 'drop',
      event: e
    })
    if (!normalized) return
    if (Array.isArray(normalized)) {
      return {
        shouldAddElements: normalized,
        shouldMoveElements: []
      }
    } else {
      return {
        shouldAddElements: [normalized],
        shouldMoveElements: []
      }
    }
  }

  return processDrop
}

export default useDropToNoteElements
