import { IDraggableElement, ILabel, MetaLink, MetaObject } from '~/typings'
import { PartialWithId } from '@/types'
import { MetaStore, ObjectStore } from '@/api/stores'
import { Id } from '@/utils'
import { t } from 'i18next'
import addMessageAsMeta from '@/core/ai/chat/addMessageAsMeta'
import { getObjectById } from '@/api/stores/object/object.store'
import { normalizeSecondsToTime } from '@/core/components/media/utils'
import trans from '@/consts/trans'

const normalizeDraggable = async (
  ele: IDraggableElement
): Promise<{
  metas: PartialWithId<MetaObject>[]
  links: PartialWithId<MetaLink>[]
}> => {
  const { addMetaObject, getMetaObjectByObjectId, getCachedMetaObject } = MetaStore
  switch (ele.type) {
    case 'metaObjects': {
      return {
        metas: ele.ids.map(id => getCachedMetaObject(id)).filter(Boolean) as MetaObject[],
        links: []
      }
    }
    case 'groupItem': {
      return {
        metas: ele.value
          .filter(i => i.type === 'metaObject')
          .map(i => getCachedMetaObject(i.id))
          .filter(Boolean) as MetaObject[],
        links: []
      }
    }
    case 'noteBlock': {
      if (ele.metaId) {
        const m = getCachedMetaObject(ele.metaId)
        if (m) {
          return {
            metas: [m],
            links: []
          }
        }
      }
      break
    }
    case 'label': {
      const result = await normalizeLabel(ele.labelId)
      if (result) {
        return {
          metas: [result.meta],
          links: result.links
        }
      }
      break
    }
    case 'question': {
      const obj = await ObjectStore('question').getOneById(ele.objectId)
      if (obj) {
        const parentMeta = obj.parentObjectId ? MetaStore.getMetaObjectByObjectId(obj.parentObjectId) : undefined
        const questionMeta =
          getMetaObjectByObjectId(ele.objectId) ||
          (await addMetaObject({
            type: 'question',
            objectId: ele.objectId,
            name: obj.name,
            description: obj.description,
            fromObject: parentMeta ? { type: parentMeta.type, metaId: parentMeta.id } : undefined
          }))
        return {
          metas: [questionMeta],
          links: parentMeta
            ? [
                {
                  id: Id.getId(),
                  sourceId: parentMeta.id,
                  targetId: questionMeta.id
                }
              ]
            : []
        }
      }
      break
    }
    case 'message': {
      const messageMeta = await addMessageAsMeta(ele.objectId, ele.prevMessageId)
      if (messageMeta) {
        return {
          metas: [MetaStore.getCachedMetaObject(messageMeta)!],
          links: []
        }
      }
      break
    }
  }
  return {
    metas: [],
    links: []
  }
}

const normalizeLabel = async (
  labelId: number
): Promise<
  | {
      links: PartialWithId<MetaLink>[]
      meta: PartialWithId<MetaObject>
    }
  | undefined
> => {
  const label = ((await getObjectById(labelId)) as ILabel) || undefined
  if (!label || !label.parentObjectId) return
  const labelMeta = MetaStore.getMetaObjectByObjectId(labelId)
  const parentObject = await getObjectById(label.parentObjectId)
  const shouldAddLink = false
  let parentMeta: MetaObject | undefined = undefined
  if ('specType' in parentObject && parentObject?.specType) {
    parentMeta = MetaStore.getMetaObjectByObjectId(parentObject.id)
  }
  const parentName = parentMeta?.name || t(trans.Unnamed)
  if (labelMeta) {
    return {
      meta: labelMeta,
      links: shouldAddLink && parentMeta ? [{ id: Id.getId(), sourceId: parentMeta.id, targetId: labelMeta.id }] : []
    }
  } else {
    const id = Id.getId()
    let placeholderName = undefined
    if ('selectedText' in label && label.selectedText?.length) {
      placeholderName = label.selectedText
    } else if ('time' in label && label.time) {
      placeholderName = parentName + ' - ' + normalizeSecondsToTime(label.time)
    }

    return {
      meta: {
        id,
        name: label.name,
        placeholderName,
        description: label.description,
        coverImgSrc: label.imageUrl,
        temp: true,
        objectId: labelId,
        type: label.specType,
        fromObject: parentMeta
          ? {
              type: parentMeta.type,
              metaId: parentMeta.id
            }
          : undefined
      },
      links: shouldAddLink && parentMeta ? [{ id: Id.getId(), sourceId: parentMeta.id, targetId: id }] : []
    }
  }
}

export default async (...args: Parameters<typeof Global.metaOps.addDraggableAsMeta>): Promise<MetaObject[]> => {
  const [data, opts] = args
  const e = opts?.event
  const draggingDetails = data || Global.values.draggingDetails
  const allMetas: MetaObject[] = []
  const isDragEvent = e && e instanceof DragEvent
  const allPendingLinks: PartialWithId<MetaLink>[] = []
  if ((!draggingDetails && !isDragEvent) || draggingDetails?.type === 'collection') {
    return Promise.reject()
  }
  if (isDragEvent) {
    const n = await Global.utils.normalizeDragEvent(e)
    console.log(n)
    if (n?.type === 'files') {
      await Promise.allSettled(
        n.files.map(async f => {
          const res = await Global.utils.normalizeFile(f)
          const m = (await ObjectStore(res.meta.type).addOneWithMeta(res.object, { currentMeta: res.meta })).meta
          allMetas.push(m)
        })
      )
    }
    if (n?.type === 'images') {
      await Promise.allSettled(
        n.imgs.map(async f => {
          const m = (await ObjectStore('image').addOneWithMeta({ url: f.path }, { currentMeta: { name: f.name, coverImgSrc: f.path } }))
            .meta
          allMetas.push(m)
        })
      )
    }
  } else if (draggingDetails) {
    const { metas, links } = await normalizeDraggable(draggingDetails)
    await Promise.all(
      metas.map(async m => {
        const cache = MetaStore.getCachedMetaObject(m.id)
        if (!cache) {
          allMetas.push(await MetaStore.addMetaObject({ ...m }))
        } else {
          allMetas.push(cache)
        }
      })
    )
    links.forEach(l => allPendingLinks.push(l))
  }
  const dropMetaId = opts?.dropOn?.metaId
  if (dropMetaId) {
    allMetas.forEach(m => {
      allPendingLinks.push({
        targetId: dropMetaId,
        sourceId: m.id,
        id: Id.getId()
      })
    })
  }
  allPendingLinks.forEach(l => {
    MetaStore.addMetaLink({ ...l })
  })
  return allMetas
}
