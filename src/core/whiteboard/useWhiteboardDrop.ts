import { useMemoizedFn } from '@/hooks'
import { globalStore, ObjectStore } from '@/stores'
import { saveFileLocally } from '@/utils/file'
import Id from '@/utils/id'
import produce from 'immer'
import { useEffect, useState } from 'react'
import { IWhiteboardNode, MetaObject } from '~/typings/data'
import { useFlow, useSetWhiteboardItems, useSetWhiteboardNodes } from './hooks'
import { isPointerOnContainer, transformXY } from './utils'
import { objectIdToMetaObjectIdMapAtom } from '@/stores/meta.store'
import { useEventHandler } from '@/events'
import { Rendevoz } from '../rendevoz'

const getAsStringPromise = (item: DataTransferItem): Promise<string> => {
  return new Promise(res => {
    item.getAsString(data => res(data))
  })
}
const useWhiteboardDrop = () => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useEventHandler('global')
  const flow = useFlow()
  const setNodes = useSetWhiteboardNodes()
  const [isDraggingInside, setDraggingInside] = useState(false)
  const setItems = useSetWhiteboardItems()
  handler.on('globalDragPointerUp', async data => {
    const { draggingElement, event } = data

    if (flow.parentContainerEle?.contains(event.target as HTMLElement)) {
      if (!isPointerOnContainer(event)) return
      let expanded = false
      if (draggingElement.type === 'note') {
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
          // todo: can we sync?
          setTimeout(() => {
            setItems(items =>
              produce(items, draft => {
                draft?.push({
                  type: 'note',
                  id: draggingElement.noteId
                })
              })
            )
          })
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
    if (e.dataTransfer?.items) {
      let whiteboardNode: Partial<IWhiteboardNode> = {}
      const fileItem = Array.from(e.dataTransfer.items).find(i => i.kind === 'file')
      if (fileItem) {
        const file = fileItem.getAsFile()
        if (!file) return
        const { name, path } = file

        const res = await saveFileLocally(path, name)
        if (fileItem.type.startsWith('image')) {
          whiteboardNode = {
            type: 'image',
            imageUrl: res.data,
            name
          }
        }
        if (fileItem.type.startsWith('audio')) {
          whiteboardNode = {
            type: 'audio',
            audioUrl: res.data,
            name
          }
        }
        if (fileItem.type.startsWith('video')) {
          whiteboardNode = {
            type: 'video',
            videoUrl: res.data,
            name
          }
        }
      } else {
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
      whiteboardNode.x = transformedXY?.x
      whiteboardNode.y = transformedXY?.y
      whiteboardNode.id = Id.getId()
      setNodes(nodes =>
        produce(nodes, draft => {
          draft.set(whiteboardNode.id, whiteboardNode)
        })
      )
    }
  })
  const insertMetaObjectAtPointer = (e: PointerEvent, metaId: number, expanded = false) => {
    setNodes(nodes => {
      const transformedXY = transformXY(flow.containerEle?.getBoundingClientRect(), e.clientX, e.clientY, flow.containerTransformScale)
      if (transformedXY) {
        return produce(nodes, draft => {
          const nodeId = Id.getId()
          draft.set(nodeId, {
            id: nodeId,
            x: transformedXY.x,
            y: transformedXY.y,
            metaObjectId: metaId,
            type: 'metaObject',
            name: '',
            expanded
          })
        })
      }
      return nodes
    })
  }
  const insertNoteCardAtPointer = (e: PointerEvent, noteId: number) => {
    setNodes(nodes => {
      const transformedXY = transformXY(flow.containerEle?.getBoundingClientRect(), e.clientX, e.clientY, flow.containerTransformScale)
      if (transformedXY) {
        return produce(nodes, draft => {
          const nodeId = Id.getId()
          draft.set(nodeId, {
            id: nodeId,
            x: transformedXY.x,
            y: transformedXY.y,
            type: 'note',
            name: '',
            isCard: true,
            noteId
          })
        })
      }
      return nodes
    })
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
