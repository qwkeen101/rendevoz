import { BuiltInDraggableElement, CustomElement, IEditorEvent, MetaObject } from '~/typings'
import { Rendevoz } from '@/core/rendevoz'
import { getSetting, GlobalDragOverlayInstance } from '@/core'
import { MetaStore, ObjectStore } from '@/api/stores'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import Id from '@/utils/id'
import { checkDropCanBeMeta } from '@/core/global/dragDrop/useDropObject'
import useDropInsertMedia from '@/core/components/editor/hooks/drag/useDropInsertMedia'

const useDrop = (noteId?: number, metaId?: number) => {
  const note = ObjectStore('note').useValue(noteId)
  const noteMeta = MetaStore.useValue(metaId || note?.metaId)
  const handleDropMedia = useDropInsertMedia()
  const handlePointerDropToNoteEditor = async (event: PointerEvent, draggableElement: BuiltInDraggableElement) => {
    if (draggableElement.type === 'noteBlock' && noteMeta) {
      if (draggableElement.noteId !== noteId) {
        const syncBlockMeta = (await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'editor',
              noteId: noteId
            },
            draggingElement: GlobalDragOverlayInstance.draggingDetails
          }
        })) as MetaObject & { type: 'syncedBlock' }
        const syncBlock = await ObjectStore('syncedBlock').getOneById(syncBlockMeta.objectId!)
        if (!syncBlock) return
        await ObjectStore('syncedBlock').updateOne({
          id: syncBlock.id,
          syncedMetaIds: pushNumberIntoUnrepeatableArray(noteMeta.id, syncBlock.syncedMetaIds)
        })
        return {
          id: Id.getId(),
          type: 'synced',
          syncVersion: 0,
          originId: syncBlockMeta.id,
          children: [{ text: '' }]
        }
      }
      return
    }
    const autoBecomeInline = getSetting().editor.objectAutoBecomeInline
    console.log(autoBecomeInline)
    const id = Id.getId()
    const metaId = (
      await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
        type: 'globalDropNeedFurtherProcess',
        data: {
          dropOn: {
            dropOn: 'editor',
            noteId: noteId
          },
          draggingElement: GlobalDragOverlayInstance.draggingDetails
        }
      })
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
      if (originSyncBlock && noteMeta?.id) {
        ObjectStore('syncedBlock').updateOne({
          id: originSyncBlock.id,
          syncedMetaIds: pushNumberIntoUnrepeatableArray(noteMeta.id, originSyncBlock.syncedMetaIds)
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
    console.log(element)
    return element
  }
  const handleDropDropToNoteEditor = async (event: DragEvent) => {
    event.preventDefault()
    if (event.dataTransfer?.getData('text/plain')) {
      const plainText = event.dataTransfer.getData('text/plain')
      return {
        type: 'paragraph',
        id: Id.getId(),
        children: [
          {
            text: plainText
          }
        ]
      }
    }
    const mediaDrop = await handleDropMedia(event)
    console.log(mediaDrop)
    if (mediaDrop?.type === 'image') {
      return {
        type: 'image',
        id: Id.getId(),
        url: mediaDrop.path,
        children: [{ text: '' }]
      }
    }
    const canBeMeta = checkDropCanBeMeta(event)
    if (!canBeMeta) {
      return
    }
    const result = (await Rendevoz.Events.Emit.GlobalEventEmitter.emitWithCallback('global', {
      type: 'globalDropNeedFurtherProcess',
      data: {
        dropOn: {
          dropOn: 'editor',
          noteId: noteId
        },
        draggingElement: Rendevoz.Actions.State.Drag.getDraggingDetails(),
        e: event
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
    return element
  }
  const handleDrop = async (e: IEditorEvent & { type: 'drop' }) => {
    if (!e.event) return
    if (e.event instanceof PointerEvent) {
      if (!e.draggingElement) return
      return await handlePointerDropToNoteEditor(e.event, e.draggingElement)
    }
    if (e.event instanceof DragEvent) {
      return await handleDropDropToNoteEditor(e.event)
    }
  }
  return handleDrop
}

export default useDrop
