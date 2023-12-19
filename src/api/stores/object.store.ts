import { GlobalEventEmitter } from '@/events'
import useDb from '@/hooks/stores/useDb'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { IRegisterdObject, IWhiteboard, IWhiteboardEdge, IWhiteboardNode, MetaObject } from '~/typings'
import { globalStore, GroupStore, MetaStore, NoteStore, ObjectStore } from './index'
import BaseStore, { initializeLocalStore } from './base.store'
import { metaObjectsAtom, objectIdToMetaObjectIdMapAtom, tagToMetaObjectIdsMapAtom, TypeToRegisteredMetaObject } from './meta.store'
import { IStore } from './types'
import { useGlobalAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { CustomTypes } from 'rendevoz'
import { deleteRendefile } from '@/utils'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
import _ from 'lodash'
export type ObjectFamily = CustomTypes['Object']

export const ObjectFamilyAtom = atomFamily(() => atom(new Map<number, ObjectFamily[keyof ObjectFamily]>()))

export const TypeToRegisteredObject = new Map<string, IRegisterdObject>()

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
  const initializedLocalStore = initializeLocalStore(objectMapAtom, objectsDb)

  const localStore: IStore<V> = {
    getAll: async () => {
      const count = await objectsDb.where('specType').equals(type).count()
      if (count === globalStore.get(objectMapAtom).size) return true
      const data = await objectsDb.where('specType').equals(type).toArray()
      globalStore.set(objectMapAtom, BaseStore.bulkAdd(data, globalStore.get(objectMapAtom)))
      return true
    },
    getAllData: async () => {
      return await initializedLocalStore.getAllData(s => s.specType === type)()
    },
    getOneById: async id => {
      try {
        const result = await initializedLocalStore.getOneById()(id)
        if (result) {
          if (
            result.specType?.includes('Label') &&
            !result.parentObjectId &&
            (result.webpageId || result.videoId || result.noteId || result.pdfId || result.documentId)
          ) {
            ObjectStore(result.specType).updateOne({
              id,
              parentObjectId: result.webpageId || result.videoId || result.noteId || result.pdfId || result.documentId
            })
          }
          options?.afterGetOneProcess?.onSuccess?.(result, true)
        }
        return result
      } catch (e) {
        return undefined
      }
    },
    fetchOneById: id => localStore.getOneById(id),
    addOne: async (n, opts) => {
      const inited = BaseStore.initBaseObject(n)
      const canFurtherProcess = await options?.beforeAddProcess?.(inited, opts)
      if (canFurtherProcess === false) {
        return Promise.reject()
      }
      inited.specType = type
      return initializedLocalStore.addOne(
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
      const obj = await localStore.addOne(n, {
        ...opts,
        preventAddMeta: true,
        silent: true
      })
      let meta: MetaObject
      try {
        if (opts?.showMetaModal) {
          const registeredDefaultName = TypeToRegisteredMetaObject.get(obj.specType)?.defaultName
          meta = (await GlobalEventEmitter().emitWithCallback('global', {
            type: 'globalNeedAddMetaObject',
            data: {
              currentObject: {
                type: obj.specType,
                objectId: obj.id,
                name: n.name || registeredDefaultName,
                ...opts.currentMeta
              }
            }
          })) as MetaObject
        } else {
          meta = await MetaStore.addMetaObject({ type: obj.specType, objectId: obj.id, ...opts?.currentMeta }, opts?.silent)
        }
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
          // setTimeout(() => {
          //   const meta = Array.from(globalStore.get(metaObjectsAtom).values()).find(i => i.objectId === obj.id)
          //
          //   if (meta && 'name' in obj && meta.name !== obj.name && 'name' in n) {
          //     MetaStore.updateMetaObject({ id: meta.id, name: obj.name }, true)
          //   }
          //   if (meta && 'description' in obj && meta.description !== obj.description && 'description' in n) {
          //     MetaStore.updateMetaObject({ id: meta.id, description: obj.description }, true)
          //   }
          // }, 0)
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
      const handleRemoveNote = async (noteId: number) => {
        const note = await ObjectStore('note').getOneById(noteId)
        if (note) {
          const contentId = note.contentId
          const blobDb = useDb('blobs')
          const url = await blobDb.get(contentId)
          if (url?.fileUrl.startsWith('rendefile')) {
            await deleteRendefile(url.fileUrl)
          }
        }
      }
      if (one) {
        switch (one.specType) {
          case 'webpage': {
            if (one.noteId) {
              await handleRemoveNote(one.noteId)
            }
            break
          }
          case 'video': {
            if (one.videoUrl?.startsWith('rendefile')) {
              deleteRendefile(one.videoUrl)
            }
            break
          }
          case 'pdf': {
            if (one.fileUrl?.startsWith('rendefile')) {
              deleteRendefile(one.fileUrl)
            }
            break
          }
          case 'image': {
            if (one.imageUrl?.startsWith('rendefile')) {
              deleteRendefile(one.imageUrl)
            }
            break
          }
          case 'note': {
            await handleRemoveNote(one.id)
            break
          }
        }
        return initializedLocalStore.deleteOneById(() => {
          // delete all labels
          if ('labels' in one && one.labels) {
            let store = undefined
            const allLabels = one.labels
            switch (one.specType) {
              case 'webpage': {
                store = ObjectStore('webpageLabel')
                break
              }
              case 'video': {
                store = ObjectStore('videoLabel')
                break
              }
              case 'note': {
                store = ObjectStore('noteLabel')
                break
              }
              case 'pdf': {
                store = ObjectStore('pdfLabel')
                break
              }
            }
            if (store) {
              allLabels.forEach(i => {
                store.deleteOneById(i)
              })
            }
          }
          options?.afterDeleteProcess?.(one)
          const objectIdToMetaObjectIdMap = globalStore.get(objectIdToMetaObjectIdMapAtom)
          const targetMeta = objectIdToMetaObjectIdMap?.get(id)

          if (targetMeta) {
            const includesMeta = MetaStore.getMetaObjectsMap().get(targetMeta)
            if (includesMeta) {
              MetaStore.deleteMetaObject(targetMeta, true, true)
            }
          }
        })(id, opts?.silent, opts?.force ?? true)
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
    addOneWithMeta: adaptStore().addOneWithMeta,
    getAllData: adaptStore().getAllData
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
  const useAll = () => {
    const all = useGlobalAtomValue(objectMapAtom)
    return all
  }
  return {
    objectMapAtom,
    localStore,
    adaptStore,
    createAtom,
    useValue,
    useAll,
    ...realStore
  }
}

export const storeMap = new Map<keyof ObjectFamily, ReturnType<typeof createObjectStore>>()

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
        case 'group':
          return createGroupStore()
        case 'webpage':
          return createWebpageStore()
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
        await NoteStore.saveNoteAsBuffer(
          [
            {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: '' }]
            }
          ],
          n.contentId
        )
      }
      if (n.labels === undefined) {
        n.labels = []
      }
      if (!n.name) {
        n.name = 'Untitled'
      }
    },
    afterDeleteProcess: obj => {
      const blobDb = useDb('blobs')
      blobDb.delete(obj.contentId)
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
      try {
        if (o.url) {
          new URL(o.url)
          o.noteId = undefined
        }
      } catch (e) {}
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
                edges: new Map((whiteboard.edges as unknown as IWhiteboardEdge[])?.map(e => [e.id, e])),
                nodes: new Map((whiteboard.nodes as unknown as IWhiteboardNode[])?.map(e => [e.id, e]))
              } as IWhiteboard,
              globalStore.get(ObjectStore('whiteboard').objectMapAtom)
            )
          )
        }
      }
    }
  })
}

const createTagStore = () => {
  return createObjectStore('tag', {
    beforeAddProcess: async o => {
      if (!o.color) {
        o.color = _.sample(DEFAULT_BACKGROUND_COLORS)
      }
      return true
    },
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
  const objectsDb = useDb('objects')
  return objectsDb.get(id)
}
export default createObjectStore
