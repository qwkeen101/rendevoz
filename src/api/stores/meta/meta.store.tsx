import getLocalTable from '@/api/stores/getLocalTable'
import { atom } from 'jotai'
import { toast } from 'react-hot-toast'
import { IStore, MetaLink, MetaObject, IIndexedMetaLinks, IIndexedMetaObjects } from '~/typings'
import BaseStore, { initializeLocalStore } from '../base.store'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from '../index'
import produce from 'immer'
import { debounce } from 'lodash'
import { useGlobalAtomValue } from '@/hooks'
import { RegisteredMetaObject } from 'rendevoz'
import SearchHelper from '@/api/textSearch/SearchHelper'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { t } from 'i18next'
import { intersectionOfMultipleSets } from '@/core'
import metaObjectChangeHandler from '@/api/stores/meta/metaObjectChangeHandler'
import MetaPropertyStore from '@/api/stores/meta/metaProperty.store'
import UserService from '@/api/services/user.service'
import metaLinkMethods from '@/api/stores/meta/metaLinkMethods'
import metaObjectMethods from '@/api/stores/meta/metaObjectMethods'
import { slateToMarkdown } from '@/core/components/editor/plugins/slateToMarkdown'

export const AI_SUMMARY_PROP_ID = 1001
export const AI_QUESTION_PROP_ID = 1002
export const REVIEW_STATE_PROP_ID = 1003
export const REVIEW_STATUS_PROP_ID = 1004

export const deletedMetaObjectsAtom = atom<Set<number>>(new Set<number>())

export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

export const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

let lastWarned = Date.now()

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

export const handleMetaOptionChange = () => {
  MetaStore.property.calculatePropertyOptionCache()
}

const createEmptyObjectIndex = () =>
  ({
    undeletedMetaObjectsSet: new Set(),
    pinnedMetaObjectsSet: new Set(),
    deletedMetaObjectsSet: new Set(),
    objectIdToMetaObjectMap: new Map(),
    tagToMetaObjectIdsMap: new Map(),
    typeToMetaObjectIdsMap: new Map(),
    propToMetaObjectIdsMap: new Map(),
    metaAttachmentIdToMetaIdsMap: new Map(),
    oldMetaObjects: new Map()
  }) as IIndexedMetaObjects
export const indexedMetaObjectsAtom = atom<IIndexedMetaObjects>(createEmptyObjectIndex())

export const indexedMetaLinksAtom = atom<IIndexedMetaLinks>({
  sourceIdToLinkIdsMap: new Map(),
  targetIdToLinkIdMap: new Map(),
  relatedIdsMap: new Map(),
  oldLinks: new Map(),
  undeletedLinksSet: new Set(),
  sourceIdToTargetIdsMap: new Map(),
  targetIdToSourceIdsMap: new Map()
} as IIndexedMetaLinks)

const MAX_META_NUMBER = 100

export type IMetaVisibleConditions = {
  showCollection?: boolean
  showAll?: true
  showHidden?: boolean
  showDeleted?: boolean
  showLabel?: boolean
  showInsideCollection?: boolean
  filter?: (o: Partial<MetaObject>) => boolean
  showTemp?: boolean
  sort?: 'viewAtAsc' | 'viewAtDsc' | 'createdAtAsc' | 'createdAtDsc' | 'nameDsc' | 'nameAsc'
}

// @ts-ignore
export default (() => {
  const { get, initBaseObject } = BaseStore
  const metaObjectDb = getLocalTable('metaObjects')
  const metaLinkDb = getLocalTable('metaLinks')
  let metaNum = 0
  const debounceGetMetaNum = debounce(async () => {
    metaNum = await metaObjectDb.count()
  }, 1000)
  const initializeObjectStore = initializeLocalStore(metaObjectsAtom, metaObjectDb)

  const localObjectStore: Pick<IStore<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: (one, options) => {
      const currentOne = globalStore.get(metaObjectsAtom).get(one.id)
      const copiedOne = { ...one }
      if (currentOne?.temp && one.temp === false) {
        copiedOne.createdAt = Date.now()
        copiedOne.updatedAt = Date.now()
      }
      if (currentOne?.deleted && !copiedOne.deleted) {
        if (currentOne.type === 'collection' && currentOne.objectId) {
          CollectionStore.recoverCollection(currentOne.objectId)
        }
      }
      return initializeObjectStore.updateOne(async obj => {
        if (obj.objectId && ('name' in one || 'description' in one)) {
          const targetObject = await ObjectStore(obj.type).getOneById(obj.objectId)
          if (targetObject) {
            ObjectStore(obj.type).updateOne(
              { id: obj.objectId, name: obj.name, description: normalizeDescription(obj.description) },
              {
                silent: true
              }
            )
          }
        }
        SearchHelper.insertDocument({
          name: obj.name || obj.placeholderName,
          description: normalizeDescription(obj.description),
          metaType: obj.type,
          placeholderName: obj.placeholderName,
          metaId: obj.id,
          id: obj.id
        })
      })(copiedOne, options)
    },
    addOne: async (one, options) => {
      if (!one.type) return Promise.reject()
      debounceGetMetaNum()
      if (!UserService.isUserPro(true) && metaNum > MAX_META_NUMBER) {
        if (Date.now() - lastWarned > 1000) {
          toast.error(t('general.Over max objects limit'))
          lastWarned = Date.now()
        }
        return Promise.reject()
      }
      if (one.objectId) {
        const checkAlreadyHasMeta = getMetaObjectByObjectId(one.objectId)
        if (checkAlreadyHasMeta !== undefined) {
          return Promise.resolve(checkAlreadyHasMeta)
        }
      }

      const initedMetaObject = initBaseObject(one) as Partial<MetaObject>
      if (!initedMetaObject.type) {
        return Promise.reject()
      }
      if (!initedMetaObject.workspace) {
        initedMetaObject.workspace = KeyvalueStore.getOne('currentWorkspace')?.id
      }
      if (!initedMetaObject.name) {
        let initedName = ''
        initedMetaObject.name = initedName
      }
      return initializeObjectStore.addOne(obj => {
        SearchHelper.insertDocument({
          name: obj.name || obj.placeholderName,
          description: normalizeDescription(obj.description),
          placeholderName: obj.placeholderName,
          metaType: obj.type,
          metaId: obj.id,
          id: obj.id
        })
      })(initedMetaObject, options)
    },
    deleteOneById: (id, options) => {
      Global.layoutOps?.closeObjectTab(id)
      const one = MetaStore.getCachedMetaObject(id)
      if (one?.type === 'collection' && one.objectId) {
        CollectionStore.deleteCollection(one.objectId, options?.force)
      }
      if (options?.force) {
        debounceGetMetaNum()
        const relatedLink = getIndexedMetaLinks().relatedIdsMap.get(id)
        relatedLink?.forEach(i => localLinkStore.deleteOneById(i, { force: true }))
        return initializeObjectStore.deleteOneById(() => {
          SearchHelper.deleteDocuments(id)
          if (one) {
            const disableDeleteOriginal = ['message']
            if (!disableDeleteOriginal.includes(one.type)) {
              const objId = one.objectId
              if (objId) {
                ObjectStore(one.type).deleteOneById(objId, { force: true })
              }
            }

            globalStore.set(
              deletedMetaObjectsAtom,
              produce(globalStore.get(deletedMetaObjectsAtom), draft => {
                draft.delete(id)
              })
            )
          }
          handleMetaObjectDelete(id)
        })(id, {
          ...options,
          clearCache: true
        })
      } else {
        return initializeObjectStore.deleteOneById(() => {
          handleMetaObjectDelete(id)
        })(id, options)
      }
    },
    getAll: async () => {
      const currentWorkspaceId = KeyvalueStore.getOne('currentWorkspace')?.id
      if (!currentWorkspaceId) return Promise.reject()
      const all = await initializeObjectStore.getAll(obj => obj.workspace === currentWorkspaceId)()
      const deleted = all.filter(i => i.deleted)
      if (deleted.length) {
        globalStore.set(deletedMetaObjectsAtom, new Set(deleted.map(i => i.id)))
      }
      return all
    }
  }

  const initializedLinkStore = initializeLocalStore(metaLinksAtom, metaLinkDb)

  const localLinkStore: Pick<IStore<MetaLink>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    addOne: (one, silent) => {
      if (one.sourceId === one.targetId) return Promise.reject()
      const allMetaLinks = Array.from(globalStore.get(metaLinksAtom).values())
      const existed = allMetaLinks.find(i => i.sourceId === one.sourceId && i.targetId === one.targetId && !i.deleted)
      if (existed) {
        return Promise.resolve(existed)
      }
      return initializedLinkStore.addOne(() => {})(one, { silent })
    },
    getAll: initializedLinkStore.getAll(),
    deleteOneById: (one, silent, force = true) => {
      return initializedLinkStore.deleteOneById(() => {})(one, { silent, force })
    },
    updateOne: (one, silent) => {
      return initializedLinkStore.updateOne(() => {})(one, { silent })
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

  const { getMetaObjectsMap, getAll, isVisibleMetaObject, useValue, useMultiple, useAll, useUndeleted } = metaObjectMethods(
    metaObjectsAtom,
    indexedMetaObjectsAtom
  )

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
  const getMetaObjectByObjectId = (objId: number, filterAll = true): MetaObject | undefined => {
    const id = MetaStore.getIndexedMetaObjects()?.objectIdToMetaObjectMap.get(objId)
    if (id) {
      return MetaStore.getCachedMetaObject(id)
    }
    if (filterAll) {
      return getAll({ showAll: true, showTemp: true, showDeleted: true }).find(i => i.objectId === objId)
    }
  }
  const useObjectToMetaValue = (objectId?: number) => {
    const index = useIndexedMetaObjects()
    const metaId = objectId ? index?.objectIdToMetaObjectMap.get(objectId) : undefined
    return useValue(metaId)
  }
  const addObjectAsMeta = async (opts: { objectId: number; type: MetaObject['type']; name?: string }) => {
    await MetaStore.addMetaObject({
      objectId: opts.objectId,
      type: opts.type,
      attachments: [],
      name: opts.name
    })
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
  const switchWorkspace = async () => {
    globalStore.set(metaObjectsAtom, new Map())
    globalStore.set(indexedMetaObjectsAtom, createEmptyObjectIndex())
    await realStore.getAllMetaObjects()
    triggerObjectIndex()
  }
  const addAIForMeta = async (
    metaId: number,
    details: {
      summary?: string
      questions?: number[]
    }
  ) => {
    const sumProp = MetaStore.property.getPropDetails(AI_SUMMARY_PROP_ID)
    if (!sumProp) {
      await ObjectStore('metaProp').addOne({
        id: AI_SUMMARY_PROP_ID,
        propType: 'string',
        icon: 'custom-magic',
        name: t('general.AI summary')
      })
    }
    const currMeta = await MetaStore.getMetaObjectById(metaId)
    if (currMeta) {
      const nextProp = produce(currMeta.properties || {}, draft => {
        if (details.summary) {
          draft[AI_SUMMARY_PROP_ID] = {
            ...draft[AI_SUMMARY_PROP_ID],
            value: details.summary
          }
        }
      })
      await MetaStore.updateMetaObject({ id: metaId, properties: nextProp }, { silent: true })
    }
  }
  const getMetaLinkBySourceAndTarget = (sourceMetaId: number, targetMetaId: number): number | undefined => {
    const index = getIndexedMetaLinks()
    if (index) {
      const sourceRelated = index.sourceIdToLinkIdsMap.get(sourceMetaId)
      const targetRelated = index.targetIdToLinkIdMap.get(targetMetaId)
      if (sourceRelated && targetRelated) {
        return Array.from(intersectionOfMultipleSets(sourceRelated, targetRelated).values())[0]
      }
    }
  }
  const useDeletedObjectsSet = () => {
    return useGlobalAtomValue(deletedMetaObjectsAtom)
  }
  const getVisibleMetaTypes = (opts?: { showLabel?: boolean; showHidden?: boolean; metas?: MetaObject[] }): MetaObject['type'][] => {
    const allMetas = opts?.metas || Array.from(MetaStore.getMetaObjectsMap().values())
    const typeSet = new Set<MetaObject['type']>()
    allMetas.forEach(i => {
      if (
        MetaStore.isVisibleMetaObject(i, {
          showHidden: opts?.showHidden,
          showDeleted: false,
          showLabel: opts?.showLabel
        })
      ) {
        typeSet.add(i.type)
      }
    })
    return Array.from(typeSet.values())
  }
  const triggerObjectIndex = () => {
    metaObjectChangeHandler()
  }
  const addMetaAsAttachment = async (sourceMetaId: number | number[], targetMetaId: number) => {
    const targetMeta = await MetaStore.getMetaObjectById(targetMetaId)
    if (targetMeta) {
      const sourceIdArr = (Array.isArray(sourceMetaId) ? sourceMetaId : [sourceMetaId]).filter(
        i => !targetMeta.attachments?.some(o => o.id === i)
      )
      if (sourceIdArr.length) {
        const shouldAddLink = false
        const source = sourceIdArr.map(i => MetaStore.getCachedMetaObject(i)).filter(i => i) as MetaObject[]
        source.forEach(i => {
          MetaStore.updateMetaObject({ id: i.id, hidden: true })
          if (shouldAddLink) {
            MetaStore.addMetaLink({ sourceId: i.id, targetId: targetMetaId })
          }
        })
        await MetaStore.updateMetaObject({
          id: targetMetaId,
          attachments: [
            ...source.map(i => ({
              id: i.id,
              type: i.type,
              createdAt: Date.now()
            })),
            ...(targetMeta.attachments || [])
          ]
        })
      }
    }
  }
  const refreshFromDB = async (type: 'object' | 'link', key: number) => {
    if (type === 'object') {
      const value = await metaObjectDb.get(key)
      if (value) {
        SearchHelper.insertDocument({
          name: value.name || value.placeholderName,
          description: normalizeDescription(value.description),
          metaType: value.type,
          placeholderName: value.placeholderName,
          metaId: value.id,
          id: value.id
        })
        globalStore.set(metaObjectsAtom, BaseStore.update(value, globalStore.get(metaObjectsAtom)))
      }
    }
    if (type === 'link') {
      const value = await metaLinkDb.get(key)
      if (value) {
        globalStore.set(metaLinksAtom, BaseStore.update(value, globalStore.get(metaLinksAtom)))
      }
    }
  }
  const removeFromCache = (type: 'object' | 'link', key: number) => {
    if (type === 'object') {
      globalStore.set(metaObjectsAtom, BaseStore.remove(key, globalStore.get(metaObjectsAtom)))
    }
    if (type === 'link') {
      globalStore.set(metaLinksAtom, BaseStore.remove(key, globalStore.get(metaLinksAtom)))
    }
  }
  const clearAtomData = () => {
    globalStore.set(metaObjectsAtom, new Map())
    globalStore.set(metaLinksAtom, new Map())
  }
  return {
    property: MetaPropertyStore,
    refreshFromDB,
    clearAtomData,
    useDeletedObjectsSet,
    addMetaAsAttachment,
    getMetaObjectById,
    getCachedMetaObject: (id: number) => globalStore.get(metaObjectsAtom).get(id) as MetaObject | undefined,
    getVisibleMetaTypes,
    getMetaObjectByObjectId,
    triggerObjectIndex,
    useValue,
    addAIForMeta,
    useObjectToMetaValue,
    isVisibleMetaObject,
    removeFromCache,
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
    getMetaLinkBySourceAndTarget,
    getAll,
    useMultiple,
    useAll,
    useUndeleted,
    ...realStore,
    ...metaLinkMethods
  }
})()

const normalizeDescription = (desc?: string | any[]) => {
  if (desc === undefined) return undefined
  if (typeof desc === 'string') {
    return desc
  }
  return slateToMarkdown(desc)
}

export const TypeToRegisteredMetaObject = new Map<string, RegisteredMetaObject>()
