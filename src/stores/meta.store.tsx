import { Notification } from '@/components'
import useDb from '@/hooks/stores/useDb'
import ClassName from '@/styles/classNames'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { toast } from 'react-hot-toast'
import { MetaLink, MetaObject } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import { globalStore, ObjectStore } from '.'
import { TypeToTypeName } from '@/core'
import { IStoreDeprecated } from './store.type'
import getSetting from '@/core/setting/getSetting'
import { createDraft, finishDraft } from 'immer'
import { debounce } from 'lodash'
import { normalizeOldCollections, normalizeOldObjectsToNewObjects } from './oldItemsMove'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks'

export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

export const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

const { orderedData, orderedArray } = BaseStore

export const handleMetaObjectsChange = () => {
  console.log('triggered change')
  const prevIndex = globalStore.get(indexedMetaObjectsAtom)
  const prevMetaObjects = prevIndex?.oldMetaObjects as Map<number, MetaObject> | undefined
  const newMetaObjects = globalStore.get(metaObjectsAtom)
  // question: what is the cost of creating a new set from exisiting set?
  // no need to create new set becuz everytime its reference is different: Array.from(...)
  const undeletedMetaObjectsSet: Set<MetaObject> = prevIndex?.undeletedMetaObjectsSet || new Set()
  const pinnedMetaObjectsSet: Set<MetaObject> = prevIndex?.pinnedMetaObjectsSet || new Set()
  const deletedMetaObjectsSet: Set<MetaObject> = prevIndex?.deletedMetaObjectsSet || new Set()
  // need shallow copy to rerender components
  const objectIdToMetaObjectMap: Map<number, number> = new Map(prevIndex?.objectIdToMetaObjectMap)
  const tagToMetaObjectIdsMap: Map<number, Set<number>> = new Map(prevIndex?.tagToMetaObjectIdsMap)
  const typeToMetaObjectIdsMap: Map<string, Set<number>> = new Map(prevIndex?.typeToMetaObjectIdsMap)
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
      // if (oldValue.objectId) {
      //   if (objectIdToMetaObjectMap.get(oldValue.objectId) === oldValue.id) {
      //     objectIdToMetaObjectMap.delete(oldValue.objectId)
      //   }
      // }
      if (oldValue.tags) {
        oldValue.tags.forEach(tag => {
          tagToMetaObjectIdsMap.get(tag)?.delete(oldValue.id)
        })
      }
    }
    if (v.temp || v.deleted) {
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
    undeletedMetaObjectsSet.add(v)
    if (v.pinned) {
      pinnedMetaObjectsSet.add(v)
    }
    if (v.objectId) {
      objectIdToMetaObjectMap.set(v.objectId, v.id)
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
  })
  // left is force deleted objects

  idSet?.forEach(id => {
    const v = prevMetaObjects?.get(id)!
    undeletedMetaObjectsSet.delete(v)
    pinnedMetaObjectsSet.delete(v)
    v.objectId && objectIdToMetaObjectMap.delete(v.objectId)
    typeToMetaObjectIdsMap.get(v.type)?.delete(id)
    v.tags?.forEach(tag => {
      if (tagToMetaObjectIdsMap.has(tag)) {
        tagToMetaObjectIdsMap.get(tag)?.add(v.id)
      } else {
        const set = new Set<number>()
        set.add(v.id)
        tagToMetaObjectIdsMap.set(tag, set)
      }
    })
  })
  const shouldReturnObjectIdToMetaObjectMap =
    prevIndex?.objectIdToMetaObjectMap.size === objectIdToMetaObjectMap.size ? prevIndex.objectIdToMetaObjectMap : objectIdToMetaObjectMap

  globalStore.set(indexedMetaObjectsAtom, {
    undeletedMetaObjectsSet,
    pinnedMetaObjectsSet,
    deletedMetaObjectsSet,
    objectIdToMetaObjectMap: shouldReturnObjectIdToMetaObjectMap,
    tagToMetaObjectIdsMap,
    oldMetaObjects: newMetaObjects,
    typeToMetaObjectIdsMap
  })
}

const debounceSetUndeleted = debounce(() => {
  const prevIndex = globalStore.get(indexedMetaObjectsAtom)
  if (prevIndex) {
    globalStore.set(indexedMetaObjectsAtom, {
      ...prevIndex,
      undeletedMetaObjectsSet: new Set(prevIndex?.undeletedMetaObjectsSet)
    })
  }
}, 50)

export const handleMetaObjectDelete = (id: number) => {
  const prevMetaObjects = globalStore.get(indexedMetaObjectsAtom)?.oldMetaObjects
  const metaObject = prevMetaObjects?.get(id)
  const undeleted = globalStore.get(indexedMetaObjectsAtom)?.undeletedMetaObjectsSet
  if (metaObject) {
    undeleted?.delete(metaObject)
    debounceSetUndeleted()
  }
}
export const indexedMetaObjectsAtom = atom<{
  undeletedMetaObjectsSet: Set<MetaObject>
  pinnedMetaObjectsSet: Set<MetaObject>
  deletedMetaObjectsSet: Set<MetaObject>
  objectIdToMetaObjectMap: Map<number, number>
  tagToMetaObjectIdsMap: Map<number, Set<number>>
  typeToMetaObjectIdsMap: Map<string, Set<number>>
  oldMetaObjects: Map<number, MetaObject>
} | null>(null)

export const handleMetaLinksChange = () => {
  const prevIndex = globalStore.get(indexedMetaLinksAtom)
  const undeletedLinksSet = prevIndex?.undeletedLinksSet || new Set()
  const sourceIdToLinkIdsMap = new Map(prevIndex?.sourceIdToLinkIdsMap)
  const targetIdToLinkIdMap = new Map(prevIndex?.targetIdToLinkIdMap)
  const newMetaLinks = globalStore.get(metaLinksAtom)
  const relatedIdsMapDraft = createDraft(prevIndex?.relatedIdsMap || new Map<number, Set<number>>())

  const oldLinks = prevIndex?.oldLinks
  newMetaLinks.forEach((link, id) => {
    const { sourceId, targetId } = link
    const oldLink = oldLinks?.get(id)
    // early quit
    if (oldLink === link) {
      return
    }
    if (oldLink) {
      undeletedLinksSet.delete(oldLink)
    }
    if (link.deleted) {
      sourceIdToLinkIdsMap.get(sourceId)?.delete(id)
      targetIdToLinkIdMap.get(targetId)?.delete(id)
      relatedIdsMapDraft.get(sourceId)?.delete(targetId)
      relatedIdsMapDraft.get(targetId)?.delete(sourceId)
      return
    }
    undeletedLinksSet.add(link)
    if (relatedIdsMapDraft.has(sourceId)) {
      relatedIdsMapDraft.get(sourceId)?.add(targetId)
    } else {
      relatedIdsMapDraft.set(sourceId, new Set([targetId]))
    }
    if (relatedIdsMapDraft.has(targetId)) {
      relatedIdsMapDraft.get(targetId)?.add(sourceId)
    } else {
      relatedIdsMapDraft.set(targetId, new Set([sourceId]))
    }
    if (sourceIdToLinkIdsMap.has(sourceId)) {
      sourceIdToLinkIdsMap.get(sourceId)?.add(id)
    } else {
      sourceIdToLinkIdsMap.set(sourceId, new Set([id]))
    }
    if (targetIdToLinkIdMap.has(targetId)) {
      targetIdToLinkIdMap.get(targetId)?.add(id)
    } else {
      targetIdToLinkIdMap.set(targetId, new Set([id]))
    }
  })
  globalStore.set(indexedMetaLinksAtom, {
    undeletedLinksSet,
    sourceIdToLinkIdsMap,
    targetIdToLinkIdMap,
    relatedIdsMap: finishDraft(relatedIdsMapDraft),
    oldLinks: newMetaLinks
  })
}

export const indexedMetaLinksAtom = atom<{
  sourceIdToLinkIdsMap: Map<number, Set<number>>
  targetIdToLinkIdMap: Map<number, Set<number>>
  relatedIdsMap: Map<number, Set<number>>
  oldLinks: Map<number, MetaLink>
  undeletedLinksSet: Set<MetaLink>
} | null>(null)

export const orderedMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))

export const undeletedMetaObjectsAtom = atom(get => orderedArray(Array.from(get(indexedMetaObjectsAtom)?.undeletedMetaObjectsSet || [])))

export const pinnedMetaObjectsAtom = atom(get => Array.from(get(indexedMetaObjectsAtom)?.pinnedMetaObjectsSet || []).reverse())

const allMetaLinksAtom = atom(get => orderedData(get(metaLinksAtom)))

export const undeletedMetaLinksAtom = atom(get => orderedArray(Array.from(get(indexedMetaLinksAtom)?.undeletedLinksSet || [])))

export const relatedMetaObjectsMapAtom = atom(get => get(indexedMetaLinksAtom)?.relatedIdsMap || new Map<number, Set<number>>())

export const objectIdToMetaObjectIdMapAtom = atom(get => get(indexedMetaObjectsAtom)?.objectIdToMetaObjectMap)

export const tagToMetaObjectIdsMapAtom = atom(get => get(indexedMetaObjectsAtom)?.tagToMetaObjectIdsMap)

const createMetaStore = () => {
  const { get, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaLinkDb = useDb('metaLinks')

  const initializeObjectStore = initializeLocalStore(metaObjectsAtom, metaObjectDb)
  const shouldToastObject = (silent?: boolean) => {
    const setting = getSetting()
    return !silent && setting.notification.enabled && setting.notification.object
  }
  const localObjectStore: Pick<IStoreDeprecated<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: (one, silent) => {
      return initializeObjectStore.updateOne(obj => {
        if (obj.objectId && one.name) {
          switch (obj.type) {
            case 'pdf': {
              ObjectStore('pdf').updateOne({ id: obj.objectId, name: obj.name }, { silent: true })
              break
            }
            case 'note': {
              ObjectStore('note').updateOne({ id: obj.objectId, title: obj.name }, { silent: true })
              break
            }
            case 'whiteboard': {
              ObjectStore('whiteboard').updateOne({ id: obj.objectId, name: obj.name }, { silent: true })
              break
            }
          }
        }
        shouldToastObject(silent) &&
          toast.success(
            <Notification
              title="Object successfully updated!"
              content={<div className={ClassName.description()}>Object Name: {one.name}</div>}
            />
          )
      })(one, silent)
    },
    addOne: async (one, silent) => {
      if (one.objectId) {
        const checkAlreadyHasMeta = await getMetaObjectByObjectId(one.objectId)
        if (checkAlreadyHasMeta !== undefined) {
          return Promise.resolve(checkAlreadyHasMeta)
        }
      }
      const initedMetaObject = initBaseObject(one)
      if (!initedMetaObject.name) {
        let initedName = 'Unnamed Object'
        switch (initedMetaObject.type) {
          case 'note':
            initedName = 'Untitled Note'
            break
          case 'pdf':
            initedName = 'Unnamed PDF'
            break
          case 'whiteboard':
            initedName = 'Unnamed Whiteboard'
            break
          case 'webpage':
            initedName = 'Unnamed Webpage'
        }
        initedMetaObject.name = initedName
      }
      initedMetaObject.type = initedMetaObject.type || 'normal'
      if (initedMetaObject.type === 'normal') {
        const noteId = Id.getId()
        initedMetaObject.objectId = noteId
        ObjectStore('note').addOne(
          {
            id: noteId,
            metaId: initedMetaObject.id
          },
          { silent: true }
        )
      }
      return initializeObjectStore.addOne(obj => {
        if (obj.objectId && one.name) {
          switch (obj.type) {
            case 'pdf': {
              ObjectStore('pdf').updateOne({ id: obj.objectId, name: obj.name }, { silent: true })
              break
            }
            case 'note': {
              ObjectStore('note').updateOne({ id: obj.objectId, title: obj.name }, { silent: true })
              break
            }
            case 'whiteboard': {
              ObjectStore('whiteboard').updateOne({ id: obj.objectId, name: obj.name }, { silent: true })
              break
            }
          }
        }
        shouldToastObject(silent) &&
          toast.success(
            <Notification
              title="Object successfully added!"
              content={
                <div className={ClassName.description()}>
                  <div>Name: {initedMetaObject.name}</div>
                  <div style={{ textTransform: 'capitalize' }}>Type: {TypeToTypeName[initedMetaObject.type || 'normal']}</div>
                </div>
              }
            />
          )
      })(initedMetaObject, silent)
    },
    deleteOneById: (id, silent, force = true) => {
      const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
      const relatedLink = allMetaLinks.filter(l => l.sourceId === id || l.targetId === id)
      relatedLink.forEach(i =>
        dispatch({
          type: 'remove',
          data: { id: i.id },
          database: metaLinkDb,
          atom: metaLinksAtom
        })
      )
      return initializeObjectStore.deleteOneById(() => {
        shouldToastObject(silent) && toast.success('Object successfully deleted!')
        handleMetaObjectDelete(id)
      })(id, silent, force)
    },
    getAll: initializeObjectStore.getAll()
  }

  const initializedLinkStore = initializeLocalStore(metaLinksAtom, metaLinkDb)

  const shouldToastLink = (silent?: boolean) => {
    const setting = getSetting()
    return !silent && setting.notification.enabled && setting.notification.link
  }

  const localLinkStore: Pick<IStoreDeprecated<MetaLink>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    addOne: (one, silent) => {
      if (one.sourceId === one.targetId) return Promise.reject()
      const allMetaLinks = globalStore.get(allMetaLinksAtom)
      const existed = allMetaLinks.find(i => i.sourceId === one.sourceId && i.targetId === one.targetId && !i.deleted)
      if (existed) {
        shouldToastLink(silent) && toast.success('Link to be added already exists!')
        return Promise.resolve(existed)
      }
      return initializedLinkStore.addOne(() => {
        shouldToastLink(silent) && toast.success('Link successfully added!')
      })(one, silent)
    },
    getAll: initializedLinkStore.getAll(),
    deleteOneById: (one, silent, force = true) => {
      return initializedLinkStore.deleteOneById(() => {
        shouldToastLink(silent) && toast.success('Link successfully deleted!')
      })(one, silent, force)
    },
    updateOne: (one, silent) => {
      return initializedLinkStore.updateOne(() => {
        shouldToastLink(silent) && toast.success('Link successfully updated!')
      })(one, silent)
    }
  }
  const realStore = {
    addMetaObject: localObjectStore.addOne,
    updateMetaObject: localObjectStore.updateOne,
    deleteMetaObject: localObjectStore.deleteOneById,
    getAllMetaObjects: localObjectStore.getAll,
    addMetaLink: localLinkStore.addOne,
    deleteMetaLink: localLinkStore.deleteOneById,
    getAllMetaLinks: localLinkStore.getAll,
    updateMetaLink: localLinkStore.updateOne
  }

  const getMetaObjectById = (id: number): Promise<MetaObject | undefined> => {
    const obj = get(id, globalStore.get(metaObjectsAtom))
    if (obj) return Promise.resolve(obj)
    return new Promise(res => {
      metaObjectDb.get(id).then(obj => {
        if (obj) {
          res(obj)
        } else {
          res(undefined)
        }
      })
    })
  }
  const getMetaObjectByObjectId = (objId: number) => {
    const metaObjectId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(objId)
    if (metaObjectId) {
      return globalStore.get(metaObjectsAtom).get(metaObjectId)
    }
  }

  const useValue = (id?: number) => {
    const ato = useMemo(() => (id ? selectAtom(metaObjectsAtom, m => m.get(id)) : atom(null)), [id])
    return useGlobalAtomValue(ato)
  }
  return {
    getMetaObjectById,
    getMetaObjectByObjectId,
    useValue,
    ...realStore
  }
}

export const metaStore = createMetaStore()

export default createMetaStore
