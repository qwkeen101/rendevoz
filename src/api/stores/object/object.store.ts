import { GlobalEventEmitter } from '@/events'
import getLocalTable from '@/api/stores/getLocalTable'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { IRegisterdObject, MetaObject } from '~/typings'
import { globalStore, GroupStore, MetaStore, NoteStore, ObjectStore } from '../index'
import BaseStore, { initializeLocalStore } from '../base.store'
import { objectIdToMetaObjectIdMapAtom, TypeToRegisteredMetaObject } from '../meta/meta.store'
import { IStore } from '../types'
import { useGlobalAtomValue } from '@/hooks'
import { CustomTypes } from 'rendevoz'
import { Rendevoz } from '@/core/rendevoz'
import deleteCallback from '@/api/stores/object/deleteCallback'
import addCallback from '@/api/stores/object/addCallback'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import createReviewStore from '@/api/stores/object/custom/ReviewCardStore'
import updateCallback from '@/api/stores/object/updateCallback'
import { FeedCollectionStore, OptionStore, TagStore, WhiteboardStore, NoteStore as NoteObjectStore } from './custom'
import { urlToIdMap } from '@/api/indexData/urlToId'
export type ObjectFamily = CustomTypes['Object']

const ObjectStoreKeys = new Set<string>()
export const ObjectFamilyAtom = atomFamily(p => {
  ObjectStoreKeys.add(p)
  return atom(new Map<number, ObjectFamily[keyof ObjectFamily]>())
})

export const TypeToRegisteredObject = new Map<string, IRegisterdObject>()

type ObjectStore<T extends keyof ObjectFamily, V extends ObjectFamily[T]> = {
  localStore: IStore<V>
  objectMapAtom: PrimitiveAtom<Map<number, V>>
  adaptStore: () => IStore<V>
  createAtom: (id?: number) => Atom<V | undefined>
  getCachedOneById: (id: number) => V | undefined
  useValue: (id?: number) => Awaited<V> | undefined
  useMultiple: (ids?: Iterable<number>) => Awaited<V[]>
} & IStore<V>
const createObjectStore = <T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>>(
  type: T,
  options?: {
    transformData?: (o: V) => V | undefined
    beforeAddProcess?: (o: Partial<V>, opts: Parameters<S['addOne']>[1]) => Promise<boolean | void>
    beforeAddMetaProcss?: (obj: Partial<V>, currentMeta?: Partial<MetaObject>) => Promise<MetaObject | undefined>
    beforeUpdateProcess?: (o: Partial<V>, opts: Parameters<S['updateOne']>[1]) => void
    beforeDeleteProcess?: (id: number, opts: Parameters<S['deleteOneById']>[1]) => Promise<boolean | void>
    beforeGetOneProcess?: () => void
    afterGetAllProcess?: (all: V[]) => V[]
    afterAddProcess?: {
      onSuccess?: (obj: V, opts: Parameters<S['addOne']>[1]) => void
      onFail?: (opts: Parameters<S['addOne']>[1]) => void
    }
    afterAddMetaProcess?: {
      onSuccess?: (obj: V, meta: MetaObject) => void
    }
    afterUpdateProcess?: {
      onSuccess?: (obj: V, silent: boolean) => void
      onFail?: (silent: boolean) => void
    }
    afterDeleteProcess?: (obj: V) => void
    afterGetOneProcess?: {
      onSuccess?: (obj: V, silent: boolean) => void
      onFail?: (silent: boolean) => void
    }
  }
): ObjectStore<T> => {
  const objectsDb = getLocalTable('objects')
  const objectMapAtom = ObjectFamilyAtom(type) as unknown as PrimitiveAtom<Map<number, V>>
  const initializedLocalStore = initializeLocalStore(objectMapAtom, objectsDb, { transformData: options?.transformData })
  // To prevent race condition
  // For example: delete one by id, delete from atom, but useValue get it again because right now data in database still not deleted
  const forcedRemoveIds = new Set<number>()
  const localStore: IStore<V> = {
    getAll: async () => {
      let data = await objectsDb.where('specType').equals(type).toArray()
      if (options?.afterGetAllProcess) {
        data = options.afterGetAllProcess(data)
      }
      if (options?.transformData) {
        data = data.map(d => options.transformData!(d))
      }
      globalStore.set(objectMapAtom, BaseStore.bulkAdd(data, new Map()))
      return true
    },
    fetchAll: async () => {
      let data = await objectsDb.where('specType').equals(type).toArray()
      if (options?.transformData) {
        data = data.map(d => options.transformData!(d))
      }
      return data
    },
    getMultipleByIds: async (id, cache) => {
      return (await initializedLocalStore.getMultipleByIds()(id, cache)).filter(i => i)
    },
    getOneById: async (id, opt) => {
      try {
        const result = await initializedLocalStore.getOneById({
          forceRefresh: opt?.forceRefresh
        })(id)
        if (result) {
          options?.afterGetOneProcess?.onSuccess?.(result, true)
        }
        return result
      } catch (e) {
        return undefined
      }
    },
    fetchOneById: id => initializedLocalStore.fetchOneById(id),
    addOne: async (n, opts) => {
      const inited = BaseStore.initBaseObject(n)
      const canFurtherProcess = await options?.beforeAddProcess?.(inited, opts)
      if (canFurtherProcess === false) {
        return Promise.reject()
      }
      inited.specType = type
      return initializedLocalStore.addOne(
        obj => {
          addCallback(obj)
          options?.afterAddProcess?.onSuccess?.(obj, opts)
        },
        () => {
          options?.afterAddProcess?.onFail?.(opts)
        }
      )(inited, opts)
    },
    addOneWithMeta: async (n, opts) => {
      const result = await options?.beforeAddMetaProcss?.(n || {}, opts?.currentMeta)
      if (result) {
        const obj = result.objectId && (await ObjectStore(result.type).getOneById(result.objectId))
        return {
          one: obj,
          meta: result
        }
      }
      // right here we add meta manually
      const obj = await localStore.addOne(n || {}, {
        ...opts,
        preventAddMeta: true,
        silent: true,
        isAddingMeta: true
      })
      let meta: MetaObject
      try {
        const registeredDefaultName = TypeToRegisteredMetaObject.get(obj.specType)?.defaultName
        let placeholderName = obj.specType ? `Unnamed ${obj.specType}` : undefined
        if (obj.specType === 'note') {
          placeholderName = 'Untitled'
        }
        if (opts?.showMetaModal) {
          meta = (await GlobalEventEmitter().emitWithCallback('global', {
            type: 'globalNeedAddMetaObject',
            data: {
              currentObject: {
                type: obj.specType,
                objectId: obj.id,
                name: obj.name || registeredDefaultName,
                placeholderName,
                ...opts.currentMeta
              }
            }
          })) as MetaObject
        } else {
          meta = await MetaStore.addMetaObject(
            { type: obj.specType, objectId: obj.id, name: obj.name || registeredDefaultName, placeholderName, ...opts?.currentMeta },
            {
              silent: opts?.silent
            }
          )
        }
        options?.afterAddMetaProcess?.onSuccess?.(obj, meta)
        return {
          one: obj,
          meta
        }
      } catch (e) {
        ObjectStore(obj.specType).deleteOneById(obj.id, { force: true, silent: true })
      }
    },
    updateOne: (n, opts) => {
      options?.beforeUpdateProcess?.(n, opts)
      return initializedLocalStore.updateOne(
        (obj, silent) => {
          updateCallback(n, obj)
          options?.afterUpdateProcess?.onSuccess?.(obj, silent)
        },
        silent => {
          options?.afterUpdateProcess?.onFail?.(silent)
        }
      )(n, opts)
    },
    deleteOneById: async (id, opts) => {
      let force = true
      if (opts?.force === false) {
        force = false
      }
      if (opts?.force !== false) {
        forcedRemoveIds.add(id)
      }
      const result = await options?.beforeDeleteProcess?.(id, opts)
      if (result === false) {
        return Promise.reject()
      }
      const one = await realStore.getOneById(id)
      if (one) {
        return initializedLocalStore.deleteOneById(() => {
          deleteCallback(one, force)
          options?.afterDeleteProcess?.(one)
          const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
          const targetMeta = objectIdToMetaObjectIdMap?.get(id)

          if (targetMeta) {
            const includesMeta = MetaStore.getMetaObjectsMap().get(targetMeta)
            if (includesMeta) {
              MetaStore.deleteMetaObject(targetMeta, {
                silent: true,
                force: true
              })
            }
          }
        })(id, { ...opts, force })
      }
      return Promise.reject()
    }
  }
  const adaptStore = () => {
    // switch between local / remote store
    // TODO: remote store
    return { ...localStore }
  }
  const realStore: IStore<V> = {
    addOne: adaptStore().addOne,
    updateOne: adaptStore().updateOne,
    deleteOneById: adaptStore().deleteOneById,
    getOneById: adaptStore().getOneById,
    getAll: adaptStore().getAll,
    fetchAll: adaptStore().fetchAll,
    fetchOneById: adaptStore().fetchOneById,
    addOneWithMeta: adaptStore().addOneWithMeta,
    getMultipleByIds: adaptStore().getMultipleByIds
  }

  const createAtom = (id?: number) => {
    const memoAtom = useMemo(() => {
      if (!id) return atom(undefined)
      const exist = globalStore.get(objectMapAtom).has(id) || forcedRemoveIds.has(id)
      if (!exist) {
        realStore.getOneById(id)
      }
      const selected = selectAtom(objectMapAtom, map => map.get(id))
      return selected
    }, [id])
    return memoAtom
  }

  const useValue = (id?: number) => {
    const atom = createAtom(id)
    return useGlobalAtomValue(atom)
  }
  const useAll = () => {
    const all = useGlobalAtomValue(objectMapAtom)
    const memoedArr = useMemo(() => {
      return Array.from(all.values())
    }, [all])
    return memoedArr
  }

  const useMultiple = (ids?: Iterable<number>): T[] => {
    const a = useMemo(() => {
      if (!ids) return atom([])
      const idArr = Array.from(ids)
      realStore.getMultipleByIds(idArr)
      const selected = selectAtom(
        objectMapAtom,
        map => idArr.map(id => map.get(id)).filter(i => i) as unknown as T[],
        (prev, curr) => prev.every((i, idx) => curr[idx] === i)
      )
      return selected
    }, [ids])
    return useGlobalAtomValue(a)
  }
  return {
    objectMapAtom,
    localStore,
    adaptStore,
    createAtom,
    useValue,
    getCachedOneById: id => {
      return globalStore.get(objectMapAtom).get(id)
    },
    useAll,
    useMultiple,
    ...realStore
  }
}

export const storeMap = new Map<keyof ObjectFamily, any>()
export const objectStore = <T extends keyof ObjectFamily>(type: T): ObjectStore<T, ObjectFamily[T]> => {
  const store = storeMap.get(type)
  if (store) {
    return store
  } else {
    const getStore = () => {
      switch (type) {
        case 'question':
          return createQuestionStore()
        case 'group':
          return createGroupStore()
        case 'webpage':
          return createWebpageStore()
        case 'note':
          return NoteObjectStore()
        case 'tag':
          return TagStore()
        case 'metaPropSelectOption':
          return OptionStore()
        case 'reviewCard':
          return createReviewStore()
        case 'whiteboard':
          return WhiteboardStore()
        case 'feedCollection':
          return FeedCollectionStore()
        case 'feedFolder':
          return createFeedFolderStore()
        default:
          return createObjectStore(type)
      }
    }
    const store = getStore()
    storeMap.set(type, store)
    return store
  }
}
const createQuestionStore = () => {
  return createObjectStore('question', {
    beforeAddProcess: async n => {
      if (!n.questionType) {
        n.questionType = 'text'
      }
    }
  })
}
const createWebpageStore = () => {
  return createObjectStore('webpage', {
    beforeAddMetaProcss: async obj => {
      if (obj.url) {
        const already = globalStore.get(urlToIdMap).get(obj.url)
        if (already) {
          const meta = MetaStore.getMetaObjectByObjectId(already)
          if (meta) {
            return meta
          }
        }
      }
    },
    beforeAddProcess: async o => {
      if (!('url' in o)) {
        o.url = ''
      }
    },
    afterAddMetaProcess: {
      onSuccess: async (obj, meta) => {
        if (obj.url) {
          const result = await Rendevoz.Utils.Web.parseWebpage(obj.url)
          console.log(obj, meta)
          if (!meta.name) {
            await MetaStore.updateMetaObject(
              { id: meta.id, coverImgSrc: result.image, name: result.title, description: result.description },
              {
                silent: true
              }
            )
          }
          if (!obj.noteId) {
            const note = await NoteStore.initializeNoteWithValue(result.content)
            if (note) {
              await ObjectStore('webpage').updateOne({
                id: obj.id,
                noteId: note.id
              })
            }
          }
        }
      }
    },
    beforeUpdateProcess: o => {
      if (!o.url?.startsWith('http://') && !o.url?.startsWith('https://') && o.url?.length) {
        o.url = 'https://' + o.url
      }
    }
  })
}

const createFeedCollectionStore = () => {
  return createObjectStore('feedCollection', {
    beforeAddProcess: async o => {
      if (!o.workspace) {
        const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
        currWorkspace && (o.workspace = currWorkspace.id)
      }
    },
    afterGetAllProcess: all => {
      const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currWorkspace) {
        return all.filter(i => !i.workspace || i.workspace === currWorkspace.id)
      }
      return all
    }
  })
}
const createFeedFolderStore = () => {
  return createObjectStore('feedFolder', {
    beforeAddProcess: async o => {
      if (!o.workspace) {
        const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
        currWorkspace && (o.workspace = currWorkspace.id)
      }
    },
    afterGetAllProcess: all => {
      const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currWorkspace) {
        return all.filter(i => !i.workspace || i.workspace === currWorkspace.id)
      }
      return all
    }
  })
}

const createTagStore = () => {
  return
}

const createGroupStore = () => {
  return createObjectStore('group', {
    beforeAddProcess: async o => {
      const initialized = GroupStore.initializeGroup()
      Object.assign(o, initialized, o)
      return true
    }
  })
}
export const getObjectById = <T extends keyof ObjectFamily>(id: number): Promise<ObjectFamily[T]> => {
  const objectsDb = getLocalTable('objects')
  return objectsDb.get(id)
}
export const refreshValueFromDB = async (key: number) => {
  const value = await getObjectById(key)
  if (value) {
    const store = ObjectStore(value.specType)
    store.getOneById(key, { forceRefresh: true })
  }
}
export const bulkRefreshValue = () => {
  const keys = Array.from(ObjectStoreKeys.values())
  keys.forEach(async k => {
    const s = ObjectStore(k)
    s.getAll()
  })
}
export const clearAllAtoms = () => {
  const keys = Array.from(ObjectStoreKeys.values())
  keys.forEach(k => {
    const atom = ObjectFamilyAtom(k)
    globalStore.set(atom, new Map())
  })
}
export default createObjectStore
