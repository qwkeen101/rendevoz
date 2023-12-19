import { useMemoizedFn } from '@/hooks'
import { globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { saveFileLocally } from '@/utils/file'
import Id from '@/utils/id'
import { useEffect, useState } from 'react'
import { IWhiteboardNode, MetaObject } from '~/typings/data'
import { useFlow } from '../../StateHooks'
import { isPointerOnContainer, transformXY } from '../../utils'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom } from '@/api/stores/meta.store'
import { useEventHandler } from '@/events'
import { Rendevoz } from '../../../../rendevoz'
import { getSetting } from '@/core'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { pushNumberIntoUnrepeatableArray } from '@/utils'
import toast from 'react-hot-toast'

const useWhiteboardDrop = () => {
  const emitter = Rendevoz.Events.Emit.GlobalEventEmitter
  const handler = useEventHandler('global')
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  handler.on('globalDragPointerUp', async data => {
    const { draggingElement, event } = data
    console.log(draggingElement, event)

    if (!isPointerOnContainer(event, instance)) return
    event.preventDefault()
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
        insertMetaObjectAtPointer(event, obj.id, false)
      })
  })

  const dropHandler = useMemoizedFn(async (e: DragEvent) => {
    e.preventDefault()
    if (!isPointerOnContainer(e, instance)) return
    const { clientX, clientY } = e
    const transformedXY = instance.coordOps?.transformWindowPositionToPosition({ x: clientX, y: clientY })
    if (e.dataTransfer?.items.length) {
      let whiteboardNode: Partial<IWhiteboardNode> = {}
      const fileItem = Array.from(e.dataTransfer.items).find(i => i.kind === 'file')
      if (fileItem) {
        const file = fileItem.getAsFile()
        if (!file) return
        const setting = getSetting()
        if (setting.whiteboard.dropFileAutoObject) {
          try {
            const result = await Rendevoz.Utils.Meta.normalizeLocalFileToMeta(file)
            if (result.meta) {
              const meta = (
                await ObjectStore(result.meta.type).addOneWithMeta({ ...result.object }, { currentMeta: { ...result.meta }, silent: true })
              ).meta
              setTimeout(() => {
                insertMetaObjectAtPointer(e, meta.id, false)
              }, 100)
              return
            }
          } catch (e) {
            toast.error(Rendevoz.Consts.Errors.NotSupportedFile())
            console.error(e)
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
          try {
            new URL(plainText)
          } catch (error) {
            console.log(plainText)
            insertNodeAtPointer(e, {
              content: [
                {
                  type: 'paragraph',
                  children: [{ text: plainText }],
                  id: Id.getId()
                }
              ],
              type: 'text'
            })
            return
          }
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
    const transformed = instance.coordOps?.transformWindowPositionToPosition({
      x: e.clientX,
      y: e.clientY
    })
    if (transformed) {
      instance.insertNode?.({
        x: transformed.x,
        y: transformed.y,
        ...node
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
}
export default useWhiteboardDrop
