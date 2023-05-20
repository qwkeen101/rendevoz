import { GlobalEventEmitter } from '@/events'
import useDb from '@/hooks/stores/useDb'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import {
  IAudio,
  IImage,
  ILabel,
  ILocalFile,
  INote,
  INoteBlock,
  INoteLabel,
  IPdfDocument,
  ITag,
  IWebpage,
  IWebpageLabel,
  IWhiteboard,
  IWhiteboardEdge,
  IWhiteboardNode,
  MetaObject
} from '~/typings'
import { globalStore, MetaStore, ObjectStore } from '.'
import BaseStore, { initializeLocalStore } from './base.store'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom, tagToMetaObjectIdsMapAtom } from './meta.store'
import { IStore } from './store.type'
import { useGlobalAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { INotificationSetting } from '@/core'

export type ObjectFamily = {
  webpage: IWebpage
  audio: IAudio
  note: { specType: 'note' } & INote
  noteLabel: INoteLabel
  noteBlock: INoteBlock
  webpageLabel: IWebpageLabel
  pdf: { specType: 'pdf' } & IPdfDocument
  whiteboard: { specType: 'whiteboard' } & IWhiteboard
  pdfLabel: ILabel & { specType: 'pdfLabel' }
  tag: ITag & { specType: 'tag' }
  image: IImage
  localFile: ILocalFile
}

export const ObjectFamilyAtom = atomFamily(() => atom(new Map<number, ObjectFamily[keyof ObjectFamily]>()))

const createObjectStore = <T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>>(
  type: T,
  options?: {
    toastEnabled?: keyof INotificationSetting['notification']
    beforeAddProcess?: (o: Partial<V>, opts: Parameters<S['addOne']>[1]) => Promise<boolean | void>
    beforeUpdateProcess?: (o: Partial<V>, opts: Parameters<S['updateOne']>[1]) => void
    beforeDeleteProcess?: (id: number, opts: Parameters<S['deleteOneById']>[1]) => Promise<boolean | void>
    beforeGetOneProcess?: () => void
    afterAddProcess?: {
      onSuccess?: (obj: V, opts: Parameters<S['addOne']>[1]) => void
      onFail?: (opts: Parameters<S['addOne']>[1]) => void
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
): {
  localStore: IStore<V>
  objectMapAtom: PrimitiveAtom<Map<number, V>>
  adaptStore: () => IStore<V>
  createAtom: (id?: number) => Atom<V | undefined>
  useValue: (id?: number) => Awaited<V> | undefined
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
    getOneById: async id => {
      const result = await initalizedLocalStore.getOneById()(id)
      if (result) {
        options?.afterGetOneProcess?.onSuccess?.(result, true)
      }
      return result
    },
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
          // if (shouldToast(opts?.silent)) {
          //   toast.success(t('toast.successfully add', { item: t(`general.${type}`) }))
          // }
          options?.afterAddProcess?.onSuccess?.(obj, opts)
        },
        () => {
          options?.afterAddProcess?.onFail?.(opts)
        }
      )(inited, opts?.silent, opts?.overPremium)
    },
    addOneWithMeta: async (n, opts) => {
      // right here we add meta manually
      const obj = await localStore.addOne(n, { ...opts, preventAddMeta: true, silent: true })
      let meta: MetaObject
      if (opts?.showMetaModal) {
        meta = (await GlobalEventEmitter().emitWithCallback('global', {
          type: 'globalNeedAddMetaObject',
          data: {
            currentObject: {
              type: obj.specType,
              objectId: obj.id,
              name: n.name || n.title || 'Unnamed Object',
              ...opts.currentMeta
            }
          }
        })) as MetaObject
      } else {
        meta = await MetaStore.addMetaObject({ type: obj.specType, objectId: obj.id, ...opts?.currentMeta })
      }
      console.log(meta)
      return {
        one: obj,
        meta
      }
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
    deleteOneById: async (id, opts) => {
      const result = await options?.beforeDeleteProcess?.(id, opts)
      if (result === false) {
        return Promise.reject()
      }
      const one = await realStore.getOneById(id)
      if (one) {
        return initalizedLocalStore.deleteOneById(() => {
          options?.afterDeleteProcess?.(one)
          const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
          const targetMeta = objectIdToMetaObjectIdMap?.get(id)
          if (targetMeta) {
            MetaStore.deleteMetaObject(targetMeta, true, true)
          }
        })(id, opts?.silent, opts?.force)
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
    fetchOneById: adaptStore().fetchOneById,
    addOneWithMeta: adaptStore().addOneWithMeta
  }

  const createAtom = (id?: number) => {
    const memoAtom = useMemo(() => {
      if (!id) return atom(undefined)
      const exist = globalStore.get(objectMapAtom).has(id)
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

  return {
    objectMapAtom,
    localStore,
    adaptStore,
    createAtom,
    useValue,
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
  createAtom: (id?: number) => Atom<ObjectFamily[T] | undefined>
  useValue: (id?: number) => Awaited<ObjectFamily[T]> | undefined
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
        case 'note':
          return createNoteStore()
        case 'tag':
          return createTagStore()
        case 'whiteboard':
          return createWhiteboardStore()
        default:
          return createObjectStore(type)
      }
    }
    const store = getStore()
    storeMap.set(type, store)
    return store
  }
}

const createNoteStore = () => {
  return createObjectStore('note', {
    beforeAddProcess: async n => {
      if (n.contentId === undefined) {
        n.contentId = Id.getId()
      }
    },
    afterDeleteProcess: obj => {
      const blobDb = useDb('blobs')
      blobDb.delete(obj.contentId)
    },
    afterUpdateProcess: {
      onSuccess: obj => {
        console.log(obj)
        const metaId = globalStore.get(objectIdToMetaObjectIdMapAtom)?.get(obj.id)
        if (metaId) {
          const meta = globalStore.get(metaObjectsAtom).get(metaId)
          if (meta && meta.name !== obj.title) {
            MetaStore.updateMetaObject({ id: metaId, name: obj.title }, true)
          }
        }
      }
    }
  })
}

const createWebpageStore = () => {
  return createObjectStore('webpage', {
    beforeAddProcess: async o => {
      if (!('url' in o)) {
        o.url = ''
      }
    },
    beforeUpdateProcess: o => {
      if (!o.url?.startsWith('http://') && !o.url?.startsWith('https://') && o.url?.length) {
        o.url = 'https://' + o.url
      }
    }
  })
}
const createWhiteboardStore = () => {
  return createObjectStore('whiteboard', {
    afterGetOneProcess: {
      onSuccess: whiteboard => {
        if (Array.isArray(whiteboard.edges) || Array.isArray(whiteboard.nodes)) {
          globalStore.set(
            ObjectStore('whiteboard').objectMapAtom,
            BaseStore.update(
              {
                ...whiteboard,
                edges: new Map((whiteboard.edges as unknown as IWhiteboardEdge[]).map(e => [e.id, e])),
                nodes: new Map((whiteboard.nodes as unknown as IWhiteboardNode[]).map(e => [e.id, e]))
              } as IWhiteboard,
              globalStore.get(ObjectStore('whiteboard').objectMapAtom)
            )
          )
        }
      }
    }
  })
}
const createNoteLabelStore = () => {
  return createObjectStore('noteLabel', {})
}
const createTagStore = () => {
  return createObjectStore('tag', {
    beforeDeleteProcess: async id => {
      const tag = await ObjectStore('tag').getOneById(id)
      if (tag && tag.name) {
        globalStore
          .get(tagToMetaObjectIdsMapAtom)
          ?.get(tag.name)
          ?.forEach(async metaId => {
            const metaObject = await MetaStore.getMetaObjectById(metaId)
            MetaStore.updateMetaObject(
              {
                id: metaId,
                tags: metaObject?.tags?.filter(i => i !== tag.name)
              },
              true
            )
          })
      }
    }
  })
}

export default createObjectStore
