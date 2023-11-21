import { BuiltInDraggableElement, ILabel, MetaLink, MetaObject } from '~/typings'
import { PartialWithId } from '@/types'
import { getSetting } from '@/core'
import Id from '@/utils/id'
import { MetaStore, ObjectStore } from '@/api/stores'
import { addLinkBetweenTwoMetaObject, createLink, transformTextContentToNameAndDescription } from '@/core/global/globalDragOverlay/utils'
import { Node } from 'slate'
import { useDb } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'

const retrieveMetaObjectByObjectId = async (objectId: number, type: MetaObject['type']) => {
  const { addMetaObject, getMetaObjectByObjectId } = MetaStore
  return (await getMetaObjectByObjectId(objectId)) || (await addMetaObject({ type, objectId }, true))
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
        (await getMetaObjectByObjectId(dragElement.pdfId)) || (await addMetaObject({ type: 'pdf', objectId: dragElement.pdfId }, true))
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
        (await getMetaObjectByObjectId(dragElement.noteId)) || (await addMetaObject({ type: 'note', objectId: dragElement.noteId }, true))
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
      const note = await ObjectStore('note').getOneById(dragElement.noteId)
      if (!note?.metaId) break
      const noteMeta = await MetaStore.getMetaObjectById(note.metaId)
      if (!noteMeta) break
      // turn in sync block when drag blocks from one note to another note or whiteboard
      const elements = dragElement.elements ? dragElement.elements : [dragElement.element]
      const syncBlockMeta = (
        await ObjectStore('syncedBlock').addOneWithMeta(
          {
            blockChildren: elements,
            syncVersion: 1,
            syncedMetaIds: [noteMeta.id]
          },
          {
            silent: true,
            currentMeta: {
              name: 'Untitled block',
              fromObject: {
                type: 'note',
                metaId: noteMeta.id
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
          sourceId: noteMeta.id,
          targetId: normalizedMetaObject.id,
          id: Id.getId()
        }
        normalizedLinks.push(metaLink)
      }
      break
      const noteBlockMeta = getMetaObjectByObjectId(dragElement.blockId)
      if (noteBlockMeta) {
        alreadyHasMeta = true
        shouldOpenEditMetaModal = false
        if (enableDragFromEditorLink && enableAll) {
          addLinkBetweenTwoMetaObject(noteMeta, noteBlockMeta)
        }
        Object.assign(normalizedMetaObject, noteBlockMeta)
      } else {
        const block = await ObjectStore('noteBlock').addOne(
          {
            blockId: dragElement.blockId,
            noteId: dragElement.noteId,
            id: dragElement.blockId
          },
          { silent: true }
        )
        normalizedMetaObject.type = 'noteBlock'
        normalizedMetaObject.objectId = block.id
        const content = dragElement.elements ? dragElement.elements.map(n => Node.string(n)).join('\r\n') : Node.string(dragElement.element)
        console.log(dragElement.element, content)
        const { name, description } = transformTextContentToNameAndDescription(content)
        normalizedMetaObject.name = name || 'Unnamed object'
        normalizedMetaObject.description = description
        normalizedMetaObject.noteId = dragElement.noteId
        if (enableDragFromEditorLink && enableAll) {
          const metaLink: PartialWithId<MetaLink> = {
            sourceId: noteMeta.id,
            targetId: normalizedMetaObject.id,
            id: Id.getId()
          }
          normalizedLinks.push(metaLink)
        }
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
        (await addMetaObject({ type: 'whiteboard', objectId: dragElement.whiteboardId }, true))
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
        return {
          normalizedMetaObject: {
            id,
            name: label.name || 'Unnamed Label',
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
