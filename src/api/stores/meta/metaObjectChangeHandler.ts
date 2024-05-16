import { globalStore } from '@/api/stores'
import { MetaObject } from '~/typings'
import { deletedMetaObjectsAtom, indexedMetaObjectsAtom, metaObjectsAtom } from '@/api/stores/meta/meta.store'
import produce from 'immer'

export default () => {
  const prevIndex = globalStore.get(indexedMetaObjectsAtom)
  const prevMetaObjects = prevIndex?.oldMetaObjects as Map<number, MetaObject> | undefined
  const newMetaObjects = globalStore.get(metaObjectsAtom)
  const metaAttachmentIdToMetaIdsMap: Map<number, Set<number>> = prevIndex?.metaAttachmentIdToMetaIdsMap || new Map()
  // question: what is the cost of creating a new set from exisiting set?
  // no need to create new set becuz everytime its reference is different: Array.from(...)
  const undeletedMetaObjectsSet: Set<MetaObject> = prevIndex?.undeletedMetaObjectsSet || new Set()
  const pinnedMetaObjectsSet: Set<MetaObject> = prevIndex?.pinnedMetaObjectsSet || new Set()
  const deletedMetaObjectsSet: Set<MetaObject> = prevIndex?.deletedMetaObjectsSet || new Set()
  // need shallow copy to rerender components
  const objectIdToMetaObjectMap: Map<number, number> = new Map(prevIndex?.objectIdToMetaObjectMap)
  const tagToMetaObjectIdsMap: Map<number, Set<number>> = new Map(prevIndex?.tagToMetaObjectIdsMap)
  const typeToMetaObjectIdsMap: Map<string, Set<number>> = new Map(prevIndex?.typeToMetaObjectIdsMap)
  const propToMetaObjectIdsMap: Map<number, Set<number>> = new Map(prevIndex?.propToMetaObjectIdsMap)
  const idSet = new Set(prevMetaObjects?.keys())
  newMetaObjects.forEach((v, k) => {
    const oldValue = prevMetaObjects?.get(k)
    idSet.delete(k)
    if (oldValue === v) {
      return
    }
    if (oldValue) {
      undeletedMetaObjectsSet.delete(oldValue)
      pinnedMetaObjectsSet.delete(oldValue)
      deletedMetaObjectsSet.delete(oldValue)
      typeToMetaObjectIdsMap.get(oldValue.type)?.delete(oldValue.id)
      if (typeToMetaObjectIdsMap.get(oldValue.type)?.size === 0) {
        typeToMetaObjectIdsMap.delete(oldValue.type)
      }
      if (oldValue.attachments) {
        oldValue.attachments
          .filter(i => i.type !== 'attachmentText')
          .forEach(att => {
            metaAttachmentIdToMetaIdsMap.get(att.id)?.delete(oldValue.id)
          })
      }
      if (oldValue.tags) {
        oldValue.tags.forEach(tag => {
          tagToMetaObjectIdsMap.get(tag)?.delete(oldValue.id)
        })
      }
      if (oldValue.properties) {
        const props = Object.keys(oldValue.properties)
        if (props.length) {
          props.forEach(id => {
            propToMetaObjectIdsMap.get(Number(id))?.delete(oldValue.id)
          })
        }
      }
    }
    if (v.objectId) {
      objectIdToMetaObjectMap.set(v.objectId, v.id)
    }
    if (v.deleted) {
      if (v.deleted) {
        deletedMetaObjectsSet.add(v)
      }
      return
    }
    if (typeToMetaObjectIdsMap.has(v.type)) {
      typeToMetaObjectIdsMap.get(v.type)?.add(k)
    } else {
      typeToMetaObjectIdsMap.set(v.type, new Set([k]))
    }
    if (v.properties) {
      Object.keys(v.properties).forEach(id => {
        const n = Number(id)
        const set = propToMetaObjectIdsMap.get(n) || new Set()
        set.add(v.id)
        propToMetaObjectIdsMap.set(n, set)
      })
    }
    undeletedMetaObjectsSet.add(v)
    if (v.pinned) {
      pinnedMetaObjectsSet.add(v)
    }
    if (v.tags) {
      v.tags.forEach(tag => {
        if (typeof tag !== 'number') return
        if (tagToMetaObjectIdsMap.has(tag)) {
          tagToMetaObjectIdsMap.get(tag)?.add(v.id)
        } else {
          const set = new Set<number>()
          set.add(v.id)
          tagToMetaObjectIdsMap.set(tag, set)
        }
      })
    }
    if (v.attachments) {
      v.attachments
        .filter(i => i.type !== 'attachmentText')
        .forEach(att => {
          const set = metaAttachmentIdToMetaIdsMap.get(att.id) || new Set<number>()
          set.add(v.id)
          metaAttachmentIdToMetaIdsMap.set(att.id, set)
        })
    }
  })
  // left is force deleted objects

  idSet?.forEach(id => {
    const v = prevMetaObjects!.get(id)!
    undeletedMetaObjectsSet.delete(v)
    pinnedMetaObjectsSet.delete(v)
    v.objectId && objectIdToMetaObjectMap.delete(v.objectId)
    typeToMetaObjectIdsMap.get(v.type)?.delete(id)
    if (typeToMetaObjectIdsMap.get(v.type)?.size === 0) {
      typeToMetaObjectIdsMap.delete(v.type)
    }
    v.tags?.forEach(tag => {
      tagToMetaObjectIdsMap.get(tag)?.delete(v.id)
    })
    v.attachments
      ?.filter(i => i.type !== 'attachmentText')
      .forEach(att => {
        metaAttachmentIdToMetaIdsMap.get(att.id)?.delete(v.id)
      })
    if (v.properties) {
      const props = Object.keys(v.properties)
      if (props.length) {
        props.forEach(id => {
          propToMetaObjectIdsMap.get(Number(id))?.delete(v.id)
        })
      }
    }
  })
  const deletedMetas = globalStore.get(deletedMetaObjectsAtom)
  if (deletedMetas.size !== deletedMetaObjectsSet.size) {
    globalStore.set(
      deletedMetaObjectsAtom,
      produce(deletedMetas, draft => {
        deletedMetaObjectsSet.forEach(d => {
          draft.add(d.id)
        })
      })
    )
  }
  globalStore.set(indexedMetaObjectsAtom, {
    undeletedMetaObjectsSet,
    pinnedMetaObjectsSet,
    deletedMetaObjectsSet,
    objectIdToMetaObjectMap: objectIdToMetaObjectMap,
    tagToMetaObjectIdsMap,
    propToMetaObjectIdsMap,
    oldMetaObjects: newMetaObjects,
    typeToMetaObjectIdsMap,
    metaAttachmentIdToMetaIdsMap
  })
}
