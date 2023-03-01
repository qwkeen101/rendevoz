import { GlobalEventHandler } from '@/events/globalEvent'
import { useGlobalEventEmitter } from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { initializePdfDocument } from '@/stores/document.store'
import { notesAtom } from '@/stores/note.store'
import { globalStore, noteStore, documentStore } from '@/stores'
import { saveFileLocally } from '@/utils/file'
import Id from '@/utils/id'
import produce from 'immer'
import { useEffect, useMemo, useState } from 'react'
import { IWhiteboardNode, MetaObject } from '~/typings/data'
import { useFlow, useSetWhiteboardItems, useSetWhiteboardNodes } from './hooks'
import { isPointerOnContainer, transformXY } from './utils'

const getAsStringPromise = (item: DataTransferItem): Promise<string> => {
  return new Promise(res => {
    item.getAsString(data => res(data))
  })
}
const useWhiteboardDrop = () => {
  const emitter = useGlobalEventEmitter()
  const handler = useMemo(() => new GlobalEventHandler(), [])
  const flow = useFlow()
  const setNodes = useSetWhiteboardNodes()
  const [isDraggingInside, setDraggingInside] = useState(false)
  const { addNote } = noteStore
  const { addDocument } = documentStore
  const setItems = useSetWhiteboardItems()
  handler.on('globalDragPointerUp', async data => {
    const { draggingElement, event } = data

    if (flow.parentContainerEle?.contains(event.target as HTMLElement)) {
      if (!isPointerOnContainer(event)) return
      let expanded = false
      if (draggingElement.type === 'note') {
        expanded = true
        if (!globalStore.get(notesAtom).has(draggingElement.noteId)) {
          await addNote({
            id: draggingElement.noteId,
            title: 'Untitled'
          })
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
      const result = await Promise.all(
        Array.from(e.dataTransfer.items).map(async (item, i) => {
          let whiteboardNode: Partial<IWhiteboardNode> = {}
          const id = Id.getId()
          if (item.kind === 'file') {
            const file = item.getAsFile()
            if (!file) return
            const { name, path } = file
            const res = await saveFileLocally(path, name)
            console.log(res, item, file)
            if (file.type.startsWith('image')) {
              whiteboardNode = {
                type: 'image',
                imageUrl: res.data,
                name
              }
            }
            if (file.type.startsWith('audio')) {
              whiteboardNode = {
                type: 'audio',
                audioUrl: res.data,
                name
              }
            }
            if (file.type.startsWith('video')) {
              whiteboardNode = {
                type: 'video',
                videoUrl: res.data,
                name
              }
            }
            if (file.type === 'application/pdf') {
              const pdf = await initializePdfDocument(file)
              if (!pdf) return
              const addedPdf = await addDocument(pdf)
              setTimeout(() => {
                setItems(items =>
                  produce(items, draft => {
                    draft?.push({
                      type: 'document',
                      id: addedPdf.id
                    })
                  })
                )
              })
              whiteboardNode = {
                type: 'pdf',
                documentId: addedPdf.id,
                name
              }
            }
          }
          if (item.kind === 'string') {
            const type = item.type
            const itemString = await getAsStringPromise(item)
            if (type === 'text/uri-list') {
              whiteboardNode = {
                type: 'webpage',
                url: itemString,
                name: itemString
              }
            }
          }
          whiteboardNode.x = transformedXY?.x
          whiteboardNode.y = transformedXY?.y
          whiteboardNode.id = id
          if (whiteboardNode.type) {
            return whiteboardNode
          }
        })
      )
      setNodes(nodes =>
        produce(nodes, draft => {
          result.forEach(i => {
            if (i?.id) {
              draft.set(i.id, i)
            }
          })
        })
      )
    }
  })
  const insertMetaObjectAtPointer = (e: PointerEvent, metaId: number, expanded = false) => {
    console.log(metaId)
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
