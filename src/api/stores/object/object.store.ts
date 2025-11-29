import getLocalTable from '@/api/stores/getLocalTable'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { BuiltInObjectTypes, IRegisterdObject, MetaObject } from '~/typings'
import { globalStore, MetaStore, ObjectStore } from '../index'
import BaseStore, { initializeLocalStore } from '../base.store'
import { TypeToRegisteredMetaObject } from '../meta/meta.store'
import { IStore } from '../types'
import { useGlobalAtomValue } from '@/hooks'
import deleteCallback from '@/api/stores/object/deleteCallback'
import addCallback from '@/api/stores/object/addCallback'
import updateCallback from '@/api/stores/object/updateCallback'
import CustomStores from './custom'
import { debounce } from 'lodash'
import SearchHelper from '@/api/textSearch/SearchHelper'
export type ObjectFamily = BuiltInObjectTypes

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
  getCachedAll: () => V[]
  useValue: (id?: number) => Awaited<V> | undefined
  useMultiple: (ids?: Iterable<number>) => Awaited<V[]>
  useAll: () => Awaited<V[]>
  useAllKeys: () => number[]
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
      triggerSearch?: boolean
    }
    afterDeleteProcess?: (obj: V) => void
    afterGetOneProcess?: {
      onSuccess?: (obj: V, silent: boolean) => void
      onFail?: (silent: boolean) => void
    }
    onSearch?: (obj: V) => Promise<string>
  }
): ObjectStore<T> => {
  const objectsDb = getLocalTable('objects')
  const objectMapAtom = ObjectFamilyAtom(type) as unknown as PrimitiveAtom<Map<number, V>>
  const initializedLocalStore = initializeLocalStore(objectMapAtom, objectsDb, { transformData: options?.transformData })
  // To prevent race condition
  // For example: delete one by id, delete from atom, but useValue get it again because right now data in database still not deleted
  const forcedRemoveIds = new Set<number>()

  const handleSearch = async (id: number | V) => {
    const obj = typeof id === 'number' ? await localStore.getOneById(id) : id
    if (obj) {
      const targetMeta = MetaStore.getMetaObjectByObjectId(obj.id)
      if (targetMeta) {
        const str = await options?.onSearch?.(obj)
        if (str) {
          SearchHelper.insertDocument({
            content: str,
            id: targetMeta.id,
            metaId: targetMeta.id,
            metaType: targetMeta.type,
            description: targetMeta.description,
            placeholderName: targetMeta.placeholderName,
            name: targetMeta.name || ''
          })
        }
      }
    }
  }
  const debouncedSearch = debounce((id: number | V) => {
    handleSearch(id)
  }, 1000)

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
    fetchByConditions: async conditions => {
      let data = await objectsDb.where({ specType: type, ...conditions }).toArray()
      if (options?.transformData) {
        data = data.map(d => options.transformData!(d))
      }
      return data
    },
    fetchAll: async () => {
      let data = await objectsDb.where('specType').equals(type).toArray()
      if (options?.transformData) {
        data = data.map(d => options.transformData!(d))
      }
      return data
    },
    getMultipleByIds: async (id = [], cache) => {
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
          meta = (await Global.metaOps?.openCreateForm({
            type: obj.specType,
            objectId: obj.id,
            name: obj.name || registeredDefaultName,
            placeholderName,
            ...opts.currentMeta
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
          if (options?.afterUpdateProcess?.triggerSearch) {
            debouncedSearch(obj)
          }
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
          const targetMeta = MetaStore.getMetaObjectByObjectId(id)

          if (targetMeta) {
            MetaStore.deleteMetaObject(targetMeta.id, {
              silent: true,
              force
            })
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
    fetchByConditions: adaptStore().fetchByConditions,
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

  const useAllKeys = () => {
    const all = useGlobalAtomValue(objectMapAtom)
    const memoedArr = useMemo(() => {
      return Array.from(all.keys())
    }, [all])
    return memoedArr
  }

  const useMultiple = (ids?: Iterable<number>): T[] => {
    const a = useMemo(() => {
      if (!ids) return atom([])
      const idArr = Array.from(ids)
      realStore.getMultipleByIds(idArr, true)
      const selected = selectAtom(
        objectMapAtom,
        map => idArr.map(id => map.get(id)).filter(i => i) as unknown as T[],
        (prev, curr) => {
          return prev.length === curr.length && prev.every((i, idx) => curr[idx] === i)
        }
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
    useAllKeys,
    triggerSearch: async (id: number, debounce = true) => {
      if (debounce) {
        debouncedSearch(id)
      } else {
        handleSearch(id)
      }
    },
    getCachedAll: () => {
      return Array.from(globalStore.get(objectMapAtom).values())
    },
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
    const customStore = CustomStores[type]
    const store = customStore?.() || createObjectStore(type)
    storeMap.set(type, store)
    return store
  }
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
export const removeFromCache = (key: number) => {
  const keys = Array.from(ObjectStoreKeys.values())
  keys.some(k => {
    if (globalStore.get(ObjectStore(k).objectMapAtom).has(key)) {
      globalStore.set(ObjectStore(k).objectMapAtom, BaseStore.remove(key, globalStore.get(ObjectStore(k).objectMapAtom)))
      return true
    }
  })
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
