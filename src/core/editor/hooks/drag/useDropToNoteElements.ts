import { BuiltInDraggableElement, CustomEditor, CustomElement, IEditorInstance, MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { Path } from 'slate'
import { getSetting, GlobalDragOverlayInstance, ID_TO_PATH_MAP } from '@/core'
import Id from '@/utils/id'
import { checkDropCanBeMeta } from '@/core/global/globalDragOverlay/useDropObject'
import useDragCreateSyncBlock from '@/core/editor/hooks/drag/useDragCreateSyncBlock'
import { MetaStore, ObjectStore } from '@/stores'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import useDropInsertMedia from '@/core/editor/hooks/drag/useDropInsertMedia'

/**
 * 拖拽到笔记上到元素可能是笔记块或者其他元素，分情况处理
 * 还会遇到带有隐藏到元素的，比如折叠等
 * shouldAddElements, shouldMoveElements
 */

const useDropToNoteElements = (instance: IEditorInstance, editor: CustomEditor) => {
  const toggleOps = instance.toggleOps
  useDragCreateSyncBlock(instance, editor)
  const handleDropMedia = useDropInsertMedia()
  const processDrop = async (e: PointerEvent | DragEvent) => {
    const result = e instanceof PointerEvent ? await handlePointerDrop(e) : await handleDragDrop(e)
    return result
  }

  const handlePointerDrop = async (e: PointerEvent) => {
    const draggingElement = Rendevoz.Actions.State.Drag.getDraggingDetails() as BuiltInDraggableElement | undefined
    if (!draggingElement) return

    if (draggingElement.type === 'noteBlock') {
      if (draggingElement.noteId !== editor.noteId) {
        const syncBlockMeta = (await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'editor',
              noteId: editor.noteId
            },
            draggingElement: GlobalDragOverlayInstance.draggingDetails
          }
        })) as MetaObject & { type: 'syncedBlock' }
        const noteMeta = editor.note?.metaId
        if (!noteMeta) return
        const syncBlock = (await ObjectStore('syncedBlock').getOneById(syncBlockMeta.objectId))!

        await ObjectStore('syncedBlock').updateOne({
          id: syncBlockMeta.objectId,
          syncedMetaIds: pushNumberIntoUnrepeatableArray(noteMeta, syncBlock.syncedMetaIds)
        })

        const node = {
          id: Id.getId(),
          type: 'synced',
          syncVersion: 0,
          originId: syncBlockMeta.id,
          children: [{ text: '' }]
        }
        return {
          shouldAddElements: [node],
          shouldMoveElements: []
        }
      }
      if (!draggingElement.element && !draggingElement.elements) return
      // 1.移动笔记内的块
      const arrayDragElements = draggingElement.elements?.length ? [...draggingElement.elements] : [draggingElement.element]
      // 添加被折叠的块到拖拽中
      const normalizedElements = toggleOps?.extendElements(arrayDragElements).map(i => i[0])
      return {
        shouldMoveElements: normalizedElements,
        shouldAddElements: []
      }
    } else {
      // 2.拖动实体或未成实体的到笔记中
      const autoBecomeInline = getSetting().editor.objectAutoBecomeInline
      const id = Id.getId()
      console.log(id)
      const metaId =
        draggingElement.type === 'metaElement'
          ? draggingElement.metaId
          : (
              (await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
                type: 'globalDropNeedFurtherProcess',
                data: {
                  dropOn: {
                    dropOn: 'editor',
                    noteId: editor.noteId
                  },
                  draggingElement: GlobalDragOverlayInstance.draggingDetails
                }
              })) as MetaObject
            ).id
      let element: CustomElement | undefined = undefined
      const targetMeta = await MetaStore.getMetaObjectById(metaId)
      if (targetMeta?.type === 'syncedBlock') {
        element = {
          type: 'synced',
          originId: targetMeta.id,
          syncVersion: 0,
          children: [{ text: '' }],
          id: Id.getId()
        }
        const originSyncBlock = await ObjectStore('syncedBlock').getOneById(targetMeta.objectId)
        if (originSyncBlock && editor.note?.metaId) {
          ObjectStore('syncedBlock').updateOne({
            id: originSyncBlock.id,
            syncedMetaIds: pushNumberIntoUnrepeatableArray(editor.note.metaId, originSyncBlock.syncedMetaIds)
          })
        }
      } else {
        element = autoBecomeInline
          ? {
              type: 'paragraph',
              id,
              children: [
                {
                  type: 'inline-metaObject',
                  originId: metaId,
                  id: Id.getId(),
                  children: [{ text: '' }]
                }
              ]
            }
          : {
              type: 'metaObject',
              originId: metaId,
              id,
              children: [{ text: '' }]
            }
      }
      return {
        shouldMoveElements: [],
        shouldAddElements: [element]
      }
    }
  }

  const handleDragDrop = async (e: DragEvent) => {
    e.preventDefault()
    // not meta, just plain text drop
    const canBeMeta = checkDropCanBeMeta(e)
    if (!canBeMeta) {
      if (e.dataTransfer?.getData('text/plain')) {
        const plainText = e.dataTransfer.getData('text/plain')
        return {
          shouldAddElements: [
            {
              type: 'paragraph',
              id: Id.getId(),
              children: [
                {
                  text: plainText
                }
              ]
            }
          ],
          shouldMoveElements: []
        }
      }
      const result = await handleDropMedia(e)
      if (result?.type === 'image') {
        return {
          shouldAddElements: [
            {
              type: 'image',
              id: Id.getId(),
              url: result.path,
              children: [{ text: '' }]
            }
          ],
          shouldMoveElements: []
        }
      }
    }
    const result = (await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
      type: 'globalDropNeedFurtherProcess',
      data: {
        dropOn: {
          dropOn: 'editor',
          noteId: editor.noteId
        },
        draggingElement: Rendevoz.Actions.State.Drag.getDraggingDetails(),
        e
      }
    })) as MetaObject
    const autoBecomeInline = getSetting().editor.objectAutoBecomeInline
    const id = Id.getId()
    const element: CustomElement = autoBecomeInline
      ? {
          type: 'paragraph',
          id,
          children: [
            {
              type: 'inline-metaObject',
              originId: result.id,
              id: Id.getId(),
              children: [{ text: '' }]
            }
          ]
        }
      : {
          type: 'metaObject',
          originId: result.id,
          id,
          children: [{ text: '' }]
        }
    return {
      shouldAddElements: [element],
      shouldMoveElements: []
    }
  }

  const getElementPath = (element: CustomElement): Path => {
    if (!element.id) {
      throw new Error("Can't find element's id")
    }
    const path = ID_TO_PATH_MAP.get(editor)?.get(element.id)
    if (!path) throw new Error("Can't find element's path")
    return path
  }

  return processDrop
}

export default useDropToNoteElements
