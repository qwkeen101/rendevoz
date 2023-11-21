import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom } from 'jotai/vanilla'
import { toast } from 'react-hot-toast'
import { MetaGroup, MetaGroupChild, MetaLink, MetaObject } from '~/typings'
import BaseStore, { initializeLocalStore } from './base.store'
import { findChangedProperties, globalStore, GroupStore, MetaStore, ObjectStore } from './index'
import { IStoreDeprecated } from './types'
import getSetting from '@/core/setting/getSetting'
import { createDraft, finishDraft } from 'immer'
import { debounce } from 'lodash'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { useGlobalAtomValue } from '@/hooks'
import { getUser } from '@/api/services/login.service'
import { RegisteredMetaObject } from 'rendevoz'
import SearchHelper from '@/api/textSearch/SearchHelper'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { calculateFilterObjects } from '@/core/object/filter/useBetterFilter'
import Node from '@/core/components/group/utils/node'
import { t } from 'i18next'
export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

export const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

const { orderedData, orderedArray } = BaseStore

let lastWarned = Date.now()

export const handleMetaGroupRules = () => {
  console.log('getting')
  const unhiddenMetasz = Array.from(MetaStore.getMetaObjectsMap().values()).filter(i => !i.hidden)
  const groupMetas = new Set(unhiddenMetasz.filter(i => i.type === 'group').map(i => i.objectId))
  const unhiddenMetas = unhiddenMetasz.map(i => i.id)
  ObjectStore('group')
    .getAllData()
    .then(res => {
      const groups = res as MetaGroup[]
      groups.forEach(g => {
        if (!groupMetas.has(g.id)) return
        // have automation rules
        if (g.rootFilterGroup?.rules?.length) {
          const correctObjects = calculateFilterObjects(g.rootFilterGroup, unhiddenMetas)
          if (correctObjects?.length) {
            const items = correctObjects.map(i => ({
              id: i.id,
              type: 'metaObject',
              rowId: Id.getId()
            })) as MetaGroupChild[]
            const alreadyInGroupMetaIds = new Set(
              Node.elements({ children: g.values })
                .filter(i => i[0].type === 'metaObject')
                .map(i => i[0].id)
            )
            const finalItems = items.filter(i => !alreadyInGroupMetaIds.has(i.id))
            if (finalItems.length) {
              GroupStore.insertItemsIntoGroup(finalItems, g.id)
            }
            if (g.hideObjectsInside) {
              correctObjects.forEach(o => {
                if (o.type === 'group' && g.hideGroupsInside !== true) {
                  return
                }
                MetaStore.updateMetaObject({ id: o.id, hidden: true }, true)
              })
            }
          }
        }
      })
    })
}

export const handleMetaObjectsChange = () => {
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
    }
    if (v.temp || v.deleted) {
      if (v.deleted) {
        deletedMetaObjectsSet.add(v)
      }
      return
    }
    if (!v.hidden) {
      if (typeToMetaObjectIdsMap.has(v.type)) {
        typeToMetaObjectIdsMap.get(v.type)?.add(k)
      } else {
        typeToMetaObjectIdsMap.set(v.type, new Set([k]))
      }
      undeletedMetaObjectsSet.add(v)
    }
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
    const v = prevMetaObjects?.get(id)!
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
  })

  globalStore.set(indexedMetaObjectsAtom, {
    undeletedMetaObjectsSet,
    pinnedMetaObjectsSet,
    deletedMetaObjectsSet,
    objectIdToMetaObjectMap: objectIdToMetaObjectMap,
    tagToMetaObjectIdsMap,
    oldMetaObjects: newMetaObjects,
    typeToMetaObjectIdsMap,
    metaAttachmentIdToMetaIdsMap
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

export const indexedMetaObjectsAtom = atom<
  | {
      undeletedMetaObjectsSet: Set<MetaObject>
      pinnedMetaObjectsSet: Set<MetaObject>
      deletedMetaObjectsSet: Set<MetaObject>
      objectIdToMetaObjectMap: Map<number, number>
      tagToMetaObjectIdsMap: Map<number, Set<number>>
      typeToMetaObjectIdsMap: Map<string, Set<number>>
      metaAttachmentIdToMetaIdsMap: Map<number, Set<number>>
      oldMetaObjects: Map<number, MetaObject>
    }
  | undefined
>(undefined)

export const handleMetaLinksChange = () => {
  const prevIndex = globalStore.get(indexedMetaLinksAtom)
  const undeletedLinksSet = prevIndex?.undeletedLinksSet || new Set()
  const sourceIdToLinkIdsMap = new Map(prevIndex?.sourceIdToLinkIdsMap)
  const targetIdToLinkIdMap = new Map(prevIndex?.targetIdToLinkIdMap)
  const sourceIdToTargetIdsMap = new Map<number, Set<number>>(prevIndex?.sourceIdToTargetIdsMap)
  const targetIdToSourceIdsMap = new Map<number, Set<number>>(prevIndex?.targetIdToSourceIdsMap)
  const newMetaLinks = globalStore.get(metaLinksAtom)
  const relatedIdsMapDraft = createDraft(prevIndex?.relatedIdsMap || new Map<number, Set<number>>())

  const oldLinks = prevIndex?.oldLinks
  const idSet = new Set(oldLinks?.keys())
  newMetaLinks.forEach((link, id) => {
    idSet.delete(id)
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
      sourceIdToTargetIdsMap.get(sourceId)?.delete(targetId)
      targetIdToSourceIdsMap.get(targetId)?.delete(sourceId)
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
    if (sourceIdToTargetIdsMap.has(sourceId)) {
      sourceIdToTargetIdsMap.get(sourceId)?.add(targetId)
    } else {
      sourceIdToTargetIdsMap.set(sourceId, new Set([targetId]))
    }
    if (targetIdToSourceIdsMap.has(targetId)) {
      targetIdToSourceIdsMap.get(targetId)?.add(sourceId)
    } else {
      targetIdToSourceIdsMap.set(targetId, new Set([sourceId]))
    }
    if (targetIdToLinkIdMap.has(targetId)) {
      targetIdToLinkIdMap.get(targetId)?.add(id)
    } else {
      targetIdToLinkIdMap.set(targetId, new Set([id]))
    }
  })
  idSet.forEach(id => {
    const link = oldLinks?.get(id)
    if (!link) return
    undeletedLinksSet.delete(link)
    const { sourceId, targetId } = link
    sourceIdToLinkIdsMap.get(sourceId)?.delete(id)
    targetIdToLinkIdMap.get(targetId)?.delete(id)
    sourceIdToTargetIdsMap.get(sourceId)?.delete(targetId)
    targetIdToSourceIdsMap.get(targetId)?.delete(sourceId)
    relatedIdsMapDraft.get(sourceId)?.delete(targetId)
    relatedIdsMapDraft.get(targetId)?.delete(sourceId)
  })
  globalStore.set(indexedMetaLinksAtom, {
    undeletedLinksSet,
    sourceIdToLinkIdsMap,
    targetIdToLinkIdMap,
    relatedIdsMap: finishDraft(relatedIdsMapDraft),
    oldLinks: newMetaLinks,
    sourceIdToTargetIdsMap,
    targetIdToSourceIdsMap
  })
}

export const indexedMetaLinksAtom = atom<
  | {
      sourceIdToLinkIdsMap: Map<number, Set<number>>
      targetIdToLinkIdMap: Map<number, Set<number>>
      relatedIdsMap: Map<number, Set<number>>
      oldLinks: Map<number, MetaLink>
      undeletedLinksSet: Set<MetaLink>
      sourceIdToTargetIdsMap: Map<number, Set<number>>
      targetIdToSourceIdsMap: Map<number, Set<number>>
    }
  | undefined
>(undefined)

export const orderedMetaObjectsAtom = atom(get => orderedData(get(metaObjectsAtom)))

export const undeletedMetaObjectsAtom = atom(get => orderedArray(Array.from(get(indexedMetaObjectsAtom)?.undeletedMetaObjectsSet || [])))

export const pinnedMetaObjectsAtom = atom(get => Array.from(get(indexedMetaObjectsAtom)?.pinnedMetaObjectsSet || []).reverse())

const allMetaLinksAtom = atom(get => orderedData(get(metaLinksAtom)))

export const undeletedMetaLinksAtom = atom(get => orderedArray(Array.from(get(indexedMetaLinksAtom)?.undeletedLinksSet || [])))

export const relatedMetaObjectsMapAtom = atom(get => get(indexedMetaLinksAtom)?.relatedIdsMap || new Map<number, Set<number>>())

export const objectIdToMetaObjectIdMapAtom = atom(get => get(indexedMetaObjectsAtom)?.objectIdToMetaObjectMap)

export const tagToMetaObjectIdsMapAtom = atom(get => get(indexedMetaObjectsAtom)?.tagToMetaObjectIdsMap)

export const MAX_META_NUMBER = 100

const createMetaStore = () => {
  const { get, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = useDb('metaObjects')
  const metaLinkDb = useDb('metaLinks')

  const initializeObjectStore = initializeLocalStore(metaObjectsAtom, metaObjectDb)

  const localObjectStore: Pick<IStoreDeprecated<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: (one, silent) => {
      const currentOne = globalStore.get(metaObjectsAtom).get(one.id)
      return initializeObjectStore.updateOne(async obj => {
        if (obj.objectId && one.name) {
          const targetObject = await ObjectStore(obj.type).getOneById(obj.objectId)
          if (targetObject) {
            ObjectStore(obj.type).updateOne(
              { id: obj.objectId, name: obj.name, description: obj.description },
              {
                silent: true
              }
            )
          }
        }
        SearchHelper.insertDocument({
          docType: 'metaObject',
          name: obj.name,
          description: obj.description,
          metaType: obj.type,
          metaId: obj.id,
          id: obj.id
        })
        const changed = currentOne ? findChangedProperties(currentOne, obj) : undefined
        TypeToRegisteredMetaObject.get(obj.type)?.onUpdate?.(obj, currentOne, changed)
      })(one, silent)
    },
    addOne: async (one, silent) => {
      if (!one.type) return Promise.reject()
      const user = getUser()
      const setting = getSetting()
      const allMetaNum = globalStore.get(undeletedMetaObjectsAtom).length
      if ((!user || !user.premiumEndDate || user.premiumEndDate < Date.now()) && !user?.lifetimePro && allMetaNum > MAX_META_NUMBER) {
        if (Date.now() - lastWarned > 1000) {
          toast.error(t('general.Over max objects limit'))
          lastWarned = Date.now()
        }
        return Promise.reject()
      }
      if (user?.disabled) {
        if (Date.now() - lastWarned > 1000) {
          toast.error('Your account has been disabled!')
          lastWarned = Date.now()
        }
        return Promise.reject()
      }

      if (one.objectId) {
        const checkAlreadyHasMeta = await getMetaObjectByObjectId(one.objectId)
        if (checkAlreadyHasMeta !== undefined) {
          return Promise.resolve(checkAlreadyHasMeta)
        }
      }

      const initedMetaObject = initBaseObject(one) as Partial<MetaObject>
      if (!initedMetaObject.type) {
        return Promise.reject()
      }
      if (one.fromObject) {
        const link: Partial<MetaLink> = {
          sourceId: one.fromObject.metaId,
          targetId: initedMetaObject.id
        }
        MetaStore.addMetaLink(link, true)
      }
      if (setting.object.autoHideLabelObject && initedMetaObject.type?.includes('Label')) {
        initedMetaObject.hidden = true
      }
      initedMetaObject.workspace = KeyvalueStore.getOne('currentWorkspace')
      if (!initedMetaObject.name) {
        let initedName = 'Unnamed Object'
        switch (initedMetaObject.type) {
          case 'note':
            initedName = 'Untitled'
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
        const registeredDefaultName = TypeToRegisteredMetaObject.get(initedMetaObject.type)?.defaultName

        if (registeredDefaultName) {
          initedName = registeredDefaultName
        }
        initedMetaObject.name = initedName
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
        SearchHelper.insertDocument({
          docType: 'metaObject',
          name: obj.name,
          description: obj.description,
          metaType: obj.type,
          metaId: obj.id,
          id: obj.id
        })
        TypeToRegisteredMetaObject.get(obj.type)?.onAdd?.(obj)
      })(initedMetaObject, silent)
    },
    deleteOneById: (id, silent, force = true) => {
      const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
      const one = globalStore.get(metaObjectsAtom).get(id)
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
        SearchHelper.deleteDocuments(id)
        if (one) {
          TypeToRegisteredMetaObject.get(one.type)?.onDelete?.(one)
          const objId = one.objectId
          if (objId) {
            ObjectStore(one.type).deleteOneById(objId, { force: true })
          }
        }
        handleMetaObjectDelete(id)
      })(id, silent, force)
    },
    getAll: initializeObjectStore.getAll(obj => obj.workspace === KeyvalueStore.getOne('currentWorkspace'))
  }

  const initializedLinkStore = initializeLocalStore(metaLinksAtom, metaLinkDb)

  const localLinkStore: Pick<IStoreDeprecated<MetaLink>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    addOne: (one, silent) => {
      if (one.sourceId === one.targetId) return Promise.reject()
      const allMetaLinks = globalStore.get(allMetaLinksAtom)
      const existed = allMetaLinks.find(i => i.sourceId === one.sourceId && i.targetId === one.targetId && !i.deleted)
      if (existed) {
        return Promise.resolve(existed)
      }
      return initializedLinkStore.addOne(() => {})(one, silent)
    },
    getAll: initializedLinkStore.getAll(),
    deleteOneById: (one, silent, force = true) => {
      return initializedLinkStore.deleteOneById(() => {})(one, silent, force)
    },
    updateOne: (one, silent) => {
      return initializedLinkStore.updateOne(() => {})(one, silent)
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
  const useObjectToMetaValue = (objectId?: number) => {
    const objectIdToMetaObjectIdAtom = useMemo(() => selectAtom(objectIdToMetaObjectIdMapAtom, m => m?.get(objectId || 0)), [objectId])
    const metaId = useGlobalAtomValue(objectIdToMetaObjectIdAtom)
    const metaAtom = useMemo(() => (metaId ? selectAtom(metaObjectsAtom, m => m.get(metaId)) : atom(undefined)), [metaId])
    return useGlobalAtomValue(metaAtom)
  }
  const useValue = (id?: number) => {
    const ato = useMemo(() => (id ? selectAtom(metaObjectsAtom, m => m.get(id)) : atom(undefined)), [id])
    return useGlobalAtomValue(ato)
  }
  const addObjectAsMeta = async (opts: { objectId: number; type: MetaObject['type']; name?: string }) => {
    await MetaStore.addMetaObject(
      {
        objectId: opts.objectId,
        type: opts.type,
        attachments: [],
        name: opts.name || 'Unnamed Object'
      },
      true
    )
  }

  const getMetaObjectsMap = () => {
    return globalStore.get(metaObjectsAtom)
  }
  const getMetaLinksMap = () => {
    return globalStore.get(metaLinksAtom)
  }
  const useMetaObjectsMap = () => {
    return useGlobalAtomValue(metaObjectsAtom)
  }
  const useMetaLinksMap = () => {
    return useGlobalAtomValue(metaLinksAtom)
  }
  const useIndexedMetaObjects = () => {
    return useGlobalAtomValue(indexedMetaObjectsAtom)
  }
  const getIndexedMetaObjects = () => {
    return globalStore.get(indexedMetaObjectsAtom)
  }

  const getIndexedMetaLinks = () => {
    return globalStore.get(indexedMetaLinksAtom)
  }

  const useIndexedMetaLinks = () => {
    return useGlobalAtomValue(indexedMetaLinksAtom)
  }

  const switchWorkspace = (newWorkspace: string) => {
    globalStore.set(metaObjectsAtom, new Map())
    realStore.getAllMetaObjects()
  }
  return {
    getMetaObjectById,
    getMetaObjectByObjectId,
    useValue,
    useObjectToMetaValue,
    addObjectAsMeta,
    getMetaObjectsMap,
    getMetaLinksMap,
    useMetaObjectsMap,
    useMetaLinksMap,
    getIndexedMetaObjects,
    useIndexedMetaObjects,
    getIndexedMetaLinks,
    useIndexedMetaLinks,
    switchWorkspace,
    ...realStore
  }
}

export const metaStore = createMetaStore()

export const TypeToRegisteredMetaObject = new Map<string, RegisteredMetaObject>()

export default createMetaStore
