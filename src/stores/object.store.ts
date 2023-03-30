import { GlobalEventEmitter } from '@/events'
import useDb from '@/hooks/stores/useDb'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { IAudio, INote, INoteLabel, IWebpage, IWebpageLabel } from '~/typings'
import { globalStore, MetaStore } from '.'
import BaseStore, { initializeLocalStore } from './base.store'
import { IStore } from './store.type'

export type ObjectFamily = {
  webpage: IWebpage
  audio: IAudio
  note: { specType: 'note' } & INote
  noteLabel: INoteLabel
  webpageLabel: IWebpageLabel
}

export const ObjectFamilyAtom = atomFamily((type: keyof ObjectFamily) => atom(new Map<number, ObjectFamily[keyof ObjectFamily]>()))

const createObjectStore = <T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>>(
  type: T,
  options?: {
    beforeAddProcess?: (o: Partial<V>, opts: Parameters<S['addOne']>[1]) => Promise<boolean | void>
    beforeUpdateProcess?: (o: Partial<V>, opts: Parameters<S['updateOne']>[1]) => void
    beforeDeleteProcess?: (id: number, opts: Parameters<S['deleteOneById']>[1]) => void
    beforeGetOneProcess?: () => void
    afterAddProcess?: {
      onSuccess?: (obj: V, opts: Parameters<S['addOne']>[1]) => void
      onFail?: (opts: Parameters<S['addOne']>[1]) => void
    }
    afterUpdateProcess?: {
      onSuccess?: (obj: V, silent: boolean) => void
      onFail?: (silent: boolean) => void
    }
    afterDeleteProcess?: () => void
    afterGetOneProcess?: () => void
  }
): {
  localStore: IStore<V>
  objectMapAtom: PrimitiveAtom<Map<number, V>>
  adaptStore: () => IStore<V>
  createAtom: (id: number) => Atom<V | undefined>
} & IStore<V> => {
  const objectsDb = useDb('objects')
  const objectMapAtom = ObjectFamilyAtom(type) as unknown as PrimitiveAtom<Map<number, V>>
  const initalizedLocalStore = initializeLocalStore(objectMapAtom, objectsDb)

  const localStore: IStore<V> = {
    getAll: async () => {
      const data = await objectsDb.where('specType').equals(type).toArray()
      globalStore.set(objectMapAtom, BaseStore.bulkAdd(data, globalStore.get(objectMapAtom)))
      return true
    },
    getOneById: initalizedLocalStore.getOneById(),
    fetchOneById: id => localStore.getOneById(id),
    addOne: async (n, opts) => {
      const inited = BaseStore.initBaseObject(n)
      const canFurtherProcess = await options?.beforeAddProcess?.(inited, opts)
      if (canFurtherProcess === false) {
        return Promise.reject()
      }
      inited.specType = type
      return initalizedLocalStore.addOne(
        obj => {
          options?.afterAddProcess?.onSuccess?.(obj, opts)
        },
        () => {
          options?.afterAddProcess?.onFail?.(opts)
        }
      )(inited, opts?.silent)
    },
    updateOne: (n, opts) => {
      options?.beforeUpdateProcess?.(n, opts)
      return initalizedLocalStore.updateOne(
        (obj, silent) => {
          options?.afterUpdateProcess?.onSuccess?.(obj, silent)
        },
        silent => {
          options?.afterUpdateProcess?.onFail?.(silent)
        }
      )(n, opts?.silent)
    },
    deleteOneById: (id, opts) => {
      options?.beforeDeleteProcess?.(id, opts)
      return initalizedLocalStore.deleteOneById()(id, opts?.silent)
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
    fetchOneById: adaptStore().fetchOneById
  }
  const createAtom = (id: number) => {
    const memoAtom = useMemo(() => {
      const exist = globalStore.get(objectMapAtom).has(id)
      if (!exist) {
        realStore.getOneById(id)
      }
      const selected = selectAtom(objectMapAtom, map => map.get(id))
      return selected
    }, [id])
    return memoAtom
  }
  return {
    objectMapAtom,
    localStore,
    adaptStore,
    createAtom,
    ...realStore
  }
}

const storeMap = new Map<keyof ObjectFamily, ReturnType<typeof createObjectStore>>()

export const objectStore = <T extends keyof ObjectFamily>(
  type: T
): {
  localStore: IStore<ObjectFamily[T]>
  objectMapAtom: PrimitiveAtom<Map<number, ObjectFamily[T]>>
  adaptStore: () => IStore<ObjectFamily[T]>
  createAtom: (id: number) => Atom<ObjectFamily[T] | undefined>
} & IStore<ObjectFamily[T]> => {
  const store = storeMap.get(type)
  if (store) {
    return store
  } else {
    const getStore = () => {
      switch (type) {
        case 'webpage':
          return createWebpageStore()
        case 'noteLabel':
          return createNoteLabelStore()
        default:
          return createObjectStore(type)
      }
    }
    const store = getStore()
    storeMap.set(type, store)
    return store
  }
}

const createWebpageStore = () => {
  return createObjectStore('webpage', {
    beforeAddProcess: async o => {
      if (!('url' in o)) {
        o.url = ''
      }
    },
    afterAddProcess: {
      onSuccess: async (obj, opts) => {
        if (opts?.showAddModal) {
          const webpageUrl = new URL(obj.url)
          GlobalEventEmitter().emit('global', {
            type: 'globalNeedAddMetaObject',
            data: {
              currentObject: {
                type: 'webpage',
                objectId: obj.id,
                name: obj.title,
                from: {
                  icon: obj.favicon,
                  name: webpageUrl.hostname,
                  type: 'webpage'
                }
              }
            }
          })
        } else {
          MetaStore.addMetaObject({
            objectId: obj.id,
            type: 'webpage',
            name: obj.title || 'Unnamed Webpage'
          })
        }
      }
    }
  })
}

const createNoteLabelStore = () => {
  return createObjectStore('noteLabel', {
    beforeAddProcess: o => {},
    afterAddProcess: {
      onSuccess: obj => {
        MetaStore.addMetaObject({
          objectId: obj.id,
          type: 'noteLabel',
          name: ''
        })
      }
    }
  })
}
export default createObjectStore
