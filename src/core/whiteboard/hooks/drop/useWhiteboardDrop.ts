import { useMemoizedFn } from '@/hooks'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { saveFileLocally } from '@/utils/file'
import Id from '@/utils/id'
import { useEffect, useState } from 'react'
import { IWhiteboardNode, MetaObject } from '~/typings/data'
import { useFlow } from '../../hooks'
import { isPointerOnContainer, transformXY } from '../../utils'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta.store'
import { useEventHandler } from '@/events'
import { Rendevoz } from '../../../rendevoz'
import { getSetting } from '@/core'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { pushNumberIntoUnrepeatableArray } from '@/utils'

const useWhiteboardDrop = () => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useEventHandler('global')
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  const [isDraggingInside, setDraggingInside] = useState(false)
  handler.on('globalDragPointerUp', async data => {
    const { draggingElement, event } = data
    console.log(draggingElement, event)
    if (flow.parentContainerEle?.contains(event.target as HTMLElement)) {
      if (!isPointerOnContainer(event)) return
      let expanded = false
      if (draggingElement?.type === 'whiteboard-text') {
        insertNodeAtPointer(event, {
          type: 'text',
          content: [
            {
              type: 'paragraph',
              children: [{ text: 'Write somthing here' }],
              id: Id.getId()
            }
          ]
        })
        return
      }
      if (draggingElement?.type === 'note') {
        expanded = true
        if (!globalStore.get(objectIdToMetaObjectIdMapAtom)?.has(draggingElement.noteId)) {
          // prevent add meta object
          const note = await ObjectStore('note').addOne({
            id: draggingElement.noteId,
            title: 'Untitled'
          })
          if (draggingElement.isCard) {
            insertNoteCardAtPointer(event, note.id)
            return
          }
        }
      }
      // wait for previous
      emitter
        .emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'whiteboard',
              whiteboardId: flow.whiteboardId!
            },
            draggingElement
          }
        })
        .then((obj: MetaObject) => {
          console.log(obj)
          insertMetaObjectAtPointer(event, obj.id, expanded)
        })
    }
  })

  const dropHandler = useMemoizedFn(async (e: DragEvent) => {
    e.preventDefault()
    if (!isPointerOnContainer(e)) return
    const { clientX, clientY } = e
    const transformedXY = transformXY(flow.containerEle?.getBoundingClientRect(), clientX, clientY, flow.containerTransformScale)
    console.log('yes')
    if (e.dataTransfer?.items.length) {
      let whiteboardNode: Partial<IWhiteboardNode> = {}
      const fileItem = Array.from(e.dataTransfer.items).find(i => i.kind === 'file')
      if (fileItem) {
        const file = fileItem.getAsFile()
        if (!file) return
        const setting = getSetting()
        if (setting.whiteboard.dropFileAutoObject) {
          const meta = await Rendevoz.Utils.Meta.addMetaObjectFromFile(file)
          if (meta) {
            console.log(meta)
            setTimeout(() => {
              insertMetaObjectAtPointer(e, meta.id, false)
            }, 100)
            return
          }
        }

        const { name, path } = file

        const res = await saveFileLocally(path, name)
        if (file.type.startsWith('image')) {
          whiteboardNode = {
            type: 'image',
            imageUrl: res,
            name
          }
        }
        if (file.type.startsWith('audio')) {
          whiteboardNode = {
            type: 'audio',
            audioUrl: res,
            name
          }
        }
        if (file.type.startsWith('video')) {
          whiteboardNode = {
            type: 'video',
            videoUrl: res,
            name
          }
        }
      } else {
        const plainText = e.dataTransfer?.getData('text/plain')
        if (plainText) {
          insertNodeAtPointer(e, {
            content: [
              {
                type: 'paragraph',
                children: [{ text: plainText }],
                id: Id.getId()
              }
            ],
            type: 'text',
            width: Math.min(600, 15 * plainText.length)
          })
          return
        }
        const meta = await emitter.emitWithCallback('global', {
          type: 'globalDropNeedFurtherProcess',
          data: {
            dropOn: {
              dropOn: 'whiteboard',
              whiteboardId: flow.whiteboardId!
            },
            e
          }
        })
        insertMetaObjectAtPointer(e, meta.id, false)
        return
      }
      if (!whiteboardNode.type) return
      whiteboardNode.x = transformedXY?.x
      whiteboardNode.y = transformedXY?.y
      whiteboardNode.id = Id.getId()
      instance.insertNode?.(whiteboardNode)
    }
  })
  const insertMetaObjectAtPointer = (e: PointerEvent, metaId: number, expanded = false) => {
    const transformedXY = flow.transformPointer(e)
    const targetMeta = globalStore.get(metaObjectsAtom).get(metaId)
    const whiteboardMeta = MetaStore.getMetaObjectByObjectId(flow.whiteboardId)
    if (targetMeta?.type === 'syncedBlock' && whiteboardMeta) {
      if (targetMeta.objectId) {
        ObjectStore('syncedBlock')
          .getOneById(targetMeta.objectId)
          .then(o => {
            if (o) {
              ObjectStore('syncedBlock').updateOne({
                id: targetMeta.objectId,
                syncedMetaIds: pushNumberIntoUnrepeatableArray(whiteboardMeta.id, o.syncedMetaIds)
              })
            }
          })
      }
    }
    if (transformedXY) {
      instance.insertNode?.({
        x: transformedXY.x,
        y: transformedXY.y,
        metaObjectId: metaId,
        type: 'metaObject',
        name: '',
        expanded
      })
    }
  }
  const insertNodeAtPointer = (e: PointerEvent, node: Partial<IWhiteboardNode>) => {
    const transformed = flow.transformPointer(e)
    if (transformed) {
      instance.insertNode?.({
        x: transformed.x,
        y: transformed.y,
        ...node
      })
    }
  }
  const insertNoteCardAtPointer = (e: PointerEvent, noteId: number) => {
    const transformed = flow.transformPointer(e)
    if (transformed) {
      instance.insertNode?.({
        x: transformed.x,
        y: transformed.y,
        type: 'note',
        name: '',
        isCard: true,
        noteId
      })
    }
  }
  useEffect(() => {
    const dragOverHandler = (e: DragEvent) => {
      e.preventDefault()
    }
    emitter.addListener('global', handler)

    flow.parentContainerEle?.addEventListener('drop', dropHandler)
    flow.parentContainerEle?.addEventListener('dragover', dragOverHandler)
    return () => {
      emitter.removeListener('global', handler)
      flow.parentContainerEle?.removeEventListener('drop', dropHandler)
      flow.parentContainerEle?.removeEventListener('dragover', dragOverHandler)
    }
  })
  return {
    isDraggingInside
  }
}
export default useWhiteboardDrop
