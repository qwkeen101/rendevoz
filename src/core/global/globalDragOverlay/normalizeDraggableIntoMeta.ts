import { BuiltInDraggableElement, ILabel, MetaLink, MetaObject } from '~/typings'
import { PartialWithId } from '@/types'
import { getSetting } from '@/core'
import Id from '@/utils/id'
import { MetaStore, ObjectStore } from '@/api/stores'
import { addLinkBetweenTwoMetaObject, createLink, transformTextContentToNameAndDescription } from '@/core/global/globalDragOverlay/utils'
import { Node } from 'slate'
import { useDb } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import { truncate } from 'lodash'

const retrieveMetaObjectByObjectId = async (objectId: number, type: MetaObject['type']) => {
  const { addMetaObject, getMetaObjectByObjectId } = MetaStore
  return (await getMetaObjectByObjectId(objectId)) || (await addMetaObject({ type, objectId }))
}

export default async (
  dragElement: BuiltInDraggableElement
): Promise<{
  normalizedMetaObject: MetaObject
  alreadyHasMeta: boolean
  shouldOpenEditMetaModal: boolean
  preLinks: PartialWithId<MetaLink>[]
}> => {
  const { addMetaObject, getMetaObjectById, getMetaObjectByObjectId } = MetaStore
  const setting = getSetting()
  const { enableDragFromEditorLink, enableAll } = setting.objectAndLink
  const normalizedLinks: PartialWithId<MetaLink>[] = []
  const normalizedMetaObject: PartialWithId<MetaObject & { noteId: number }> = {
    id: Id.getId()
  }
  let alreadyHasMeta = false
  let shouldOpenEditMetaModal = true
  console.log(dragElement)
  switch (dragElement?.type) {
    case 'image': {
      normalizedMetaObject.type = 'image'
      normalizedMetaObject.name = `Unnamed image ${Id.getId()}`
      normalizedMetaObject.coverImgSrc = dragElement.url
      break
    }
    case 'pdf': {
      const pdfMeta =
        (await getMetaObjectByObjectId(dragElement.pdfId)) ||
        (await addMetaObject({
          type: 'pdf',
          objectId: dragElement.pdfId
        }))
      Object.assign(normalizedMetaObject, pdfMeta)
      alreadyHasMeta = true
      shouldOpenEditMetaModal = false
      break
    }
    case 'groupItem': {
      const meta = dragElement.value.find(i => i.type === 'metaObject' && i.id)
      if (meta) {
        const metaObject = await MetaStore.getMetaObjectById(meta.id)
        if (metaObject) {
          Object.assign(normalizedMetaObject, metaObject)
          alreadyHasMeta = true
          shouldOpenEditMetaModal = false
        }
      }
      break
    }
    case 'note': {
      const noteMeta =
        (await getMetaObjectByObjectId(dragElement.noteId)) ||
        (await addMetaObject({
          type: 'note',
          objectId: dragElement.noteId
        }))
      Object.assign(normalizedMetaObject, noteMeta)
      alreadyHasMeta = true
      shouldOpenEditMetaModal = false
      break
    }
    case 'noteBlock': {
      if (dragElement.metaId) {
        const meta = await getMetaObjectById(dragElement.metaId)
        if (meta) {
          Object.assign(normalizedMetaObject, meta)
          shouldOpenEditMetaModal = false
          alreadyHasMeta = true
          break
        }
      }
      const fromMeta = dragElement.fromMetaId ? await MetaStore.getMetaObjectById(dragElement.fromMetaId) : undefined
      if (!fromMeta) break
      // turn in sync block when drag blocks from one note to another note or whiteboard
      const elements = dragElement.elements ? dragElement.elements : [dragElement.element]
      const syncBlockMeta = (
        await ObjectStore('syncedBlock').addOneWithMeta(
          {
            blockChildren: elements,
            syncVersion: 1,
            syncedMetaIds: [fromMeta.id]
          },
          {
            silent: true,
            currentMeta: {
              name: Node.string({ children: elements }),
              fromObject: {
                type: fromMeta.type,
                metaId: fromMeta.id
              }
            }
          }
        )
      ).meta
      Rendevoz.Events.Emit.GlobalEventEmitter.emit('editor', {
        type: 'turnElementsToSyncBlock',
        data: {
          syncBlockMetaId: syncBlockMeta.id,
          draggingDetails: dragElement
        }
      })
      Object.assign(normalizedMetaObject, { ...syncBlockMeta })
      if (enableDragFromEditorLink && enableAll) {
        const metaLink: PartialWithId<MetaLink> = {
          sourceId: fromMeta.id,
          targetId: normalizedMetaObject.id,
          id: Id.getId()
        }
        normalizedLinks.push(metaLink)
      }
      break
    }
    case 'metaElement': {
      const metaObject = await getMetaObjectById(dragElement.metaId)
      metaObject && Object.assign(normalizedMetaObject, metaObject)
      // we already have the meta object, so we don't need to create a new one
      shouldOpenEditMetaModal = false
      alreadyHasMeta = true
      break
    }
    case 'whiteboard': {
      const whiteboardMeta =
        (await getMetaObjectByObjectId(dragElement.whiteboardId)) ||
        (await addMetaObject({ type: 'whiteboard', objectId: dragElement.whiteboardId }))
      Object.assign(normalizedMetaObject, whiteboardMeta)
      alreadyHasMeta = true
      shouldOpenEditMetaModal = false
      break
    }
    case 'pdfLabel':
    case 'noteLabel':
    case 'webpageLabel':
    case 'audioLabel':
    case 'videoLabel': {
      const result = await normalizeLabel(dragElement.type, dragElement.labelId)
      if (result) {
        Object.assign(normalizedMetaObject, result.normalizedMetaObject)
        result.preLinks.forEach(i => normalizedLinks.push(i))
        alreadyHasMeta = result.alreadyHasMeta
        shouldOpenEditMetaModal = result.shouldOpenEditMetaModal
      }
      break
    }
    case 'question': {
      const obj = await ObjectStore(dragElement.type).getOneById(dragElement.objectId)
      if (obj) {
        alreadyHasMeta = !!MetaStore.getMetaObjectByObjectId(obj?.id)
        shouldOpenEditMetaModal = !alreadyHasMeta

        const parentMeta = obj.parentObjectId && MetaStore.getMetaObjectByObjectId(obj.parentObjectId)
        const questionMeta =
          (await getMetaObjectByObjectId(dragElement.objectId)) ||
          (await addMetaObject({
            type: dragElement.type,
            objectId: dragElement.objectId,
            name: obj.name,
            description: obj.description,
            fromObject: parentMeta ? { type: parentMeta.type, metaId: parentMeta.id } : undefined
          }))
        Object.assign(normalizedMetaObject, questionMeta)
        if (parentMeta) {
          normalizedLinks.push({
            id: Id.getId(),
            sourceId: parentMeta.id,
            targetId: questionMeta.id
          })
        }
      }
    }
  }
  return {
    normalizedMetaObject,
    shouldOpenEditMetaModal,
    alreadyHasMeta,
    preLinks: normalizedLinks
  }
}

const normalizeLabel = async (
  type: string,
  labelId: number
): Promise<
  | {
      alreadyHasMeta: boolean
      preLinks: any[]
      shouldOpenEditMetaModal: boolean
      normalizedMetaObject: Partial<MetaObject>
    }
  | undefined
> => {
  const label = ((await ObjectStore(type).getOneById(labelId)) as ILabel) || undefined
  if (!label || !label.parentObjectId) return
  const labelMeta = MetaStore.getMetaObjectByObjectId(labelId)
  const db = useDb('objects')
  const parentObject = await db.get(label.parentObjectId)
  if (parentObject.specType) {
    const realParent = await ObjectStore(parentObject.specType).getOneById(label.parentObjectId)
    if (realParent) {
      const parentMeta = await retrieveMetaObjectByObjectId(realParent.id, realParent.specType)
      if (labelMeta) {
        addLinkBetweenTwoMetaObject(parentMeta, labelMeta)
        return {
          normalizedMetaObject: labelMeta,
          shouldOpenEditMetaModal: false,
          alreadyHasMeta: true,
          preLinks: []
        }
      } else {
        const id = Id.getId()
        let placeholderName = undefined
        if ('selectedText' in label && label.selectedText?.length) {
          placeholderName = label.selectedText
        } else if ('time' in label && label.time) {
          placeholderName = parentMeta.name + ' - ' + normalizeSecondsToTime(label.time)
        }

        return {
          normalizedMetaObject: {
            id,
            name: label.name,
            placeholderName,
            description: label.description,
            coverImgSrc: label.imageUrl,
            objectId: labelId,
            type,
            fromObject: {
              type: parentMeta.type,
              metaId: parentMeta.id
            }
          },
          shouldOpenEditMetaModal: true,
          alreadyHasMeta: false,
          preLinks: [createLink(parentMeta.id, id)]
        }
      }
    }
  }
}
