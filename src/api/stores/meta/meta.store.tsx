import getLocalTable from '@/api/stores/getLocalTable'
import { atom } from 'jotai/vanilla'
import { toast } from 'react-hot-toast'
import { IMetaProp, IStore, MetaLink, MetaObject, ReviewStateType } from '~/typings'
import BaseStore, { initializeLocalStore } from '../base.store'
import { findChangedProperties, globalStore, MetaStore, ObjectStore } from '../index'
import getSetting from '@/core/setting/getSetting'
import produce from 'immer'
import { debounce } from 'lodash'
import { useMemo } from 'react'
import { selectAtom } from 'jotai/utils'
import { GlobalInstance, useGlobalAtomValue, usePrevious, useSelectGlobalAtomValue } from '@/hooks'
import { getUser } from '@/api/services/login.service'
import { RegisteredMetaObject } from 'rendevoz'
import SearchHelper from '@/api/textSearch/SearchHelper'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { t } from 'i18next'
import { intersectionOfMultipleSets } from '@/core'
import { calculateSortObjects } from '@/core/object/filter/BetterSorter'
import { Rendevoz } from '@/core/rendevoz'
import metaObjectChangeHandler from '@/api/stores/meta/metaObjectChangeHandler'
import { initializeReviewCard, reviewCard } from '@/core/review/fsrs'
import { AGAIN_OPTION_ID, EASY_OPTION_ID, GOOD_OPTION_ID, HARD_OPTION_ID } from '@/api/stores/object/custom/ReviewCardStore'
import MetaPropertyStore from '@/api/stores/meta/metaProperty.store'

export const AI_SUMMARY_PROP_ID = 1001
export const AI_QUESTION_PROP_ID = 1002
export const REVIEW_STATE_PROP_ID = 1003

export const deletedMetaObjectsAtom = atom<Set<number>>(new Set<number>())

export const metaObjectsAtom = atom<Map<number, MetaObject>>(new Map())

export const metaLinksAtom = atom<Map<number, MetaLink>>(new Map())

const { orderedArray } = BaseStore

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

export const indexedMetaObjectsAtom = atom<
  | {
      undeletedMetaObjectsSet: Set<MetaObject>
      pinnedMetaObjectsSet: Set<MetaObject>
      deletedMetaObjectsSet: Set<MetaObject>
      objectIdToMetaObjectMap: Map<number, number>
      tagToMetaObjectIdsMap: Map<number, Set<number>>
      typeToMetaObjectIdsMap: Map<string, Set<number>>
      propToMetaObjectIdsMap: Map<number, Set<number>>
      metaAttachmentIdToMetaIdsMap: Map<number, Set<number>>
      oldMetaObjects: Map<number, MetaObject>
    }
  | undefined
>(undefined)

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

export const propNameToOptionsAtom = atom<Record<string, Set<number>>>({})

export const undeletedMetaObjectsAtom = atom(get => orderedArray(Array.from(get(indexedMetaObjectsAtom)?.undeletedMetaObjectsSet || [])))

export const pinnedMetaObjectsAtom = atom(get => Array.from(get(indexedMetaObjectsAtom)?.pinnedMetaObjectsSet || []).reverse())

export const undeletedMetaLinksAtom = atom(get => orderedArray(Array.from(get(indexedMetaLinksAtom)?.undeletedLinksSet || [])))

export const relatedMetaObjectsMapAtom = atom(get => get(indexedMetaLinksAtom)?.relatedIdsMap || new Map<number, Set<number>>())

export const objectIdToMetaObjectIdMapAtom = atom(get => get(indexedMetaObjectsAtom)?.objectIdToMetaObjectMap)

export const tagToMetaObjectIdsMapAtom = atom(get => get(indexedMetaObjectsAtom)?.tagToMetaObjectIdsMap)

export const MAX_META_NUMBER = 100

const createMetaStore = () => {
  const { get, initBaseObject, dispatch } = BaseStore
  const metaObjectDb = getLocalTable('metaObjects')
  const metaLinkDb = getLocalTable('metaLinks')

  const initializeObjectStore = initializeLocalStore(metaObjectsAtom, metaObjectDb)

  const localObjectStore: Pick<IStore<MetaObject>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll'> = {
    updateOne: (one, options) => {
      const currentOne = globalStore.get(metaObjectsAtom).get(one.id)
      return initializeObjectStore.updateOne(async obj => {
        if (obj.objectId && ('name' in one || 'description' in one)) {
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
          name: obj.name || obj.placeholderName,
          description: obj.description,
          metaType: obj.type,
          placeholderName: obj.placeholderName,
          metaId: obj.id,
          id: obj.id
        })
        const changed = currentOne ? findChangedProperties(currentOne, obj) : undefined
        TypeToRegisteredMetaObject.get(obj.type)?.onUpdate?.(obj, currentOne, changed)
      })(one, options)
    },
    addOne: async (one, options) => {
      if (!one.type) return Promise.reject()
      const user = getUser()
      const setting = getSetting()

      const allMetaNum = await metaObjectDb.count()
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
      initedMetaObject.workspace = KeyvalueStore.getOne('currentWorkspace')?.id
      if (!initedMetaObject.name) {
        let initedName = ''
        const registeredDefaultName = TypeToRegisteredMetaObject.get(initedMetaObject.type)?.defaultName

        if (registeredDefaultName) {
          initedName = registeredDefaultName
        }
        initedMetaObject.name = initedName
      }
      return initializeObjectStore.addOne(obj => {
        SearchHelper.insertDocument({
          docType: 'metaObject',
          name: obj.name || obj.placeholderName,
          description: obj.description,
          placeholderName: obj.placeholderName,
          metaType: obj.type,
          metaId: obj.id,
          id: obj.id
        })
        TypeToRegisteredMetaObject.get(obj.type)?.onAdd?.(obj)
      })(initedMetaObject, options)
    },
    deleteOneById: (id, options) => {
      GlobalInstance.layoutOps?.closeObjectTab(id)
      if (options?.force) {
        const allMetaLinks = globalStore.get(undeletedMetaLinksAtom)
        const one = globalStore.get(metaObjectsAtom).get(id)
        const relatedLink = allMetaLinks.filter(l => l.sourceId === id || l.targetId === id)
        relatedLink.forEach(i =>
          dispatch({
            type: 'remove',
            data: { id: i.id },
            database: metaLinkDb,
            atom: metaLinksAtom,
            clearCache: true
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
    const metaObjectId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(objId)
    if (metaObjectId) {
      const one = globalStore.get(metaObjectsAtom).get(metaObjectId)
      return one
    }
    if (filterAll) {
      const allMetas = Array.from(globalStore.get(metaObjectsAtom).values())
      const one = allMetas.find(i => i.objectId === objId)
      return one
    }
  }
  const useObjectToMetaValue = (objectId?: number) => {
    const objectIdToMetaObjectIdAtom = useMemo(() => selectAtom(objectIdToMetaObjectIdMapAtom, m => m?.get(objectId || 0)), [objectId])
    const metaId = useGlobalAtomValue(objectIdToMetaObjectIdAtom)
    const metaAtom = useMemo(() => (metaId ? selectAtom(metaObjectsAtom, m => m.get(metaId)) : atom(undefined)), [metaId])
    return useGlobalAtomValue(metaAtom)
  }

  const useMultipleObjects = (ids: number[]) => {
    const prevIds = usePrevious(ids)
    const a = useMemo(() => {
      if (!ids) return atom([])
      const idArr = Array.from(ids)
      const selected = selectAtom(
        metaObjectsAtom,
        map => idArr.map(id => map.get(id)).filter(i => i) as MetaObject[],
        (prev, curr) => prev.every((i, idx) => curr[idx] === i)
      )
      return selected
    }, [prevIds?.length === ids.length && prevIds.every((i, idx) => ids[idx] === i)])
    return useGlobalAtomValue(a)
  }
  const useValue = (id?: number) => {
    const ato = useMemo(() => (id ? selectAtom(metaObjectsAtom, m => m.get(id)) : atom(undefined)), [id])
    return useGlobalAtomValue(ato)
  }
  const addObjectAsMeta = async (opts: { objectId: number; type: MetaObject['type']; name?: string }) => {
    await MetaStore.addMetaObject({
      objectId: opts.objectId,
      type: opts.type,
      attachments: [],
      name: opts.name
    })
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

  function isVisibleMetaObject(
    o?: Partial<MetaObject>,
    opts?: {
      showTemp?: boolean
      showDeleted?: boolean
      showHidden?: boolean
      hideLabel?: boolean
    }
  ): o is MetaObject {
    if (!o) return false
    if (o.temp && opts?.showTemp !== true) {
      return false
    }
    if (o.deleted && opts?.showDeleted !== true) {
      return false
    }
    if (opts?.hideLabel && o.type?.includes('Label')) {
      return false
    }
    if (o.hidden && opts?.showHidden !== true) {
      return false
    }
    return true
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
    globalStore.set(indexedMetaObjectsAtom, undefined)
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
        propType: 'AI summary',
        icon: 'custom-magic',
        name: t('general.AI summary')
      })
    }
    const quesProp = MetaStore.property.getPropDetails(AI_QUESTION_PROP_ID)
    if (!quesProp) {
      await ObjectStore('metaProp').addOne({
        id: AI_QUESTION_PROP_ID,
        propType: 'AI questions',
        name: t('general.AI questions'),
        icon: Rendevoz.Utils.Object.getMetaObjectIcon('question')
      })
    }
    const currMeta = await MetaStore.getMetaObjectById(metaId)
    if (currMeta) {
      const nextProp = produce(currMeta.properties || {}, draft => {
        if (details.questions) {
          draft[AI_QUESTION_PROP_ID] = {
            ...draft[AI_QUESTION_PROP_ID],
            value: details.questions
          }
        }
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
  const getMetaObjects = (sort: 'view' | 'create') => {
    const all = Array.from(MetaStore.getMetaObjectsMap().values())
    if (sort === 'view') {
      return calculateSortObjects(all, {
        sorters: [
          {
            type: 'descending',
            field: 'viewAt',
            id: 1
          }
        ]
      })
    }
    if (sort === 'create') {
      return calculateSortObjects(all, {
        sorters: [
          {
            type: 'descending',
            field: 'createdAt',
            id: 1
          }
        ]
      })
    }
    return all
  }

  const useDeletedObjectsSet = () => {
    return useGlobalAtomValue(deletedMetaObjectsAtom)
  }

  const getVisibleMetaTypes = (showTemp = true, showLabel = true): MetaObject['type'][] => {
    const allMetas = Array.from(MetaStore.getMetaObjectsMap().values())
    const typeSet = new Set<MetaObject['type']>()
    allMetas.forEach(i => {
      if (
        MetaStore.isVisibleMetaObject(i, {
          showTemp,
          showHidden: false,
          showDeleted: false,
          hideLabel: !showLabel
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
  const addMetaAsAttachment = async (sourceMetaId: number, targetMetaId: number) => {
    const targetMeta = await MetaStore.getMetaObjectById(targetMetaId)
    if (targetMeta) {
      const alreadyHave = targetMeta.attachments?.some(i => i.id === sourceMetaId)
      if (!alreadyHave) {
        const source = await MetaStore.getMetaObjectById(sourceMetaId)
        if (source) {
          await MetaStore.updateMetaObject({
            id: targetMetaId,
            attachments: [...(targetMeta.attachments || []), { type: source.type, id: sourceMetaId, createdAt: Date.now() }]
          })
        }
      }
    }
  }
  const refreshFromDB = async (type: 'object' | 'link', key: number) => {
    if (type === 'object') {
      const value = await metaObjectDb.get(key)
      if (value) {
        SearchHelper.insertDocument({
          docType: 'metaObject',
          name: value.name || value.placeholderName,
          description: value.description,
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
    useMultipleObjects,
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
    getMetaObjects,
    getMetaLinkBySourceAndTarget,
    ...realStore
  }
}

export const metaStore = createMetaStore()

export const TypeToRegisteredMetaObject = new Map<string, RegisteredMetaObject>()

export default createMetaStore
