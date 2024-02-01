import { GlobalEventEmitter } from '@/events'
import useDb from '@/hooks/stores/useDb'
import { Atom, atom, PrimitiveAtom } from 'jotai'
import { atomFamily, selectAtom } from 'jotai/utils'
import { useMemo } from 'react'
import { IRegisterdObject, IWhiteboard, IWhiteboardEdge, IWhiteboardNode, MetaObject } from '~/typings'
import { globalStore, GroupStore, MetaStore, NoteStore, ObjectStore } from '../index'
import BaseStore, { initializeLocalStore } from '../base.store'
import { objectIdToMetaObjectIdMapAtom, tagToMetaObjectIdsMapAtom, TypeToRegisteredMetaObject } from '../meta/meta.store'
import { IStore } from '../types'
import { useGlobalAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { CustomTypes } from 'rendevoz'
import { DEFAULT_BACKGROUND_COLORS } from '@/components/picker/colorPicker'
import _ from 'lodash'
import { Rendevoz } from '@/core/rendevoz'
import WebpageStore from '@/api/stores/webpage.store'
import deleteCallback from '@/api/stores/object/deleteCallback'
import addCallback from '@/api/stores/object/addCallback'
import KeyvalueStore from '@/api/stores/keyvalue.store'
export type ObjectFamily = CustomTypes['Object']

export const ObjectFamilyAtom = atomFamily(() => atom(new Map<number, ObjectFamily[keyof ObjectFamily]>()))

export const TypeToRegisteredObject = new Map<string, IRegisterdObject>()

const createObjectStore = <T extends keyof ObjectFamily, V extends ObjectFamily[T], S extends IStore<V>>(
  type: T,
  options?: {
    toastEnabled?: keyof INotificationSetting['notification']
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
      onBeforeCache?: (obj: V) => V | undefined
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
  // To prevent race condition
  // For example: delete one by id, delete from atom, but useValue get it again because right now data in database still not deleted
  const forcedRemoveIds = new Set<number>()
  const localStore: IStore<V> = {
    getAll: async () => {
      let data = await objectsDb.where('specType').equals(type).toArray()
      if (options?.afterGetAllProcess) {
        data = options.afterGetAllProcess(data)
      }
      globalStore.set(objectMapAtom, BaseStore.bulkAdd(data, new Map()))
      return true
    },
    getAllData: async () => {
      return await initializedLocalStore.getAllData(s => s.specType === type)()
    },
    getMultipleByIds: async (id, cache) => {
      return (await initializedLocalStore.getMultipleByIds()(id, cache)).filter(i => i)
    },
    getOneById: async id => {
      try {
        const result = await initializedLocalStore.getOneById({
          onBeforeCache: options?.afterGetOneProcess?.onBeforeCache
        })(id)
        if (result) {
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
    fetchOneById: adaptStore().fetchOneById,
    addOneWithMeta: adaptStore().addOneWithMeta,
    getAllData: adaptStore().getAllData,
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
    useAll,
    useMultiple,
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
  useMultiple: (ids?: Iterable<number>) => Awaited<ObjectFamily[T]>[]
  useAll: () => Awaited<ObjectFamily[T]>[]
} & IStore<ObjectFamily[T]> => {
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
          return createNoteStore()
        case 'tag':
          return createTagStore()
        case 'metaPropSelectOption':
          return createOptionStore()
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
const createOptionStore = () => {
  return createObjectStore('metaPropSelectOption', {
    beforeAddProcess: async o => {
      if (o.parentPropName) {
        const map = globalStore.get(ObjectStore('metaPropSelectOption').objectMapAtom)
        const allOptions = MetaStore.getPropOptions()[o.parentPropName]
        o.order = Math.max(...Array.from(allOptions?.values() || []).map(i => map.get(i)?.order ?? -1)) + 1
      }
    }
  })
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
    },
    afterDeleteProcess: obj => {
      const blobDb = useDb('blobs')
      blobDb.delete(obj.contentId)
    }
  })
}

const createWebpageStore = () => {
  return createObjectStore('webpage', {
    beforeAddMetaProcss: async obj => {
      if (obj.url) {
        const already = WebpageStore.getWebpageByUrl(obj.url)
        if (already) {
          const meta = MetaStore.getMetaObjectByObjectId(already.id)
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
      if (!o.noteId) {
        o.noteId = 123456
      }
    },
    afterAddMetaProcess: {
      onSuccess: async (obj, meta) => {
        if (obj.url) {
          const result = await Rendevoz.Utils.Web.parseWebpage(obj.url)
          if (!meta.name) {
            await MetaStore.updateMetaObject(
              { id: meta.id, coverImgSrc: result.image, name: result.title, description: result.description },
              {
                silent: true
              }
            )
          }

          if (obj.noteId === 123456) {
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
    afterGetAllProcess: all => {
      const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
      if (currentWorkspace) {
        console.log(all.filter(i => !i.workspace || currentWorkspace.id === i.workspace))
        return all.filter(i => !i.workspace || currentWorkspace.id === i.workspace)
      }
      return all
    },
    beforeAddProcess: async o => {
      if (!o.color) {
        o.color = _.sample(DEFAULT_BACKGROUND_COLORS)
      }
      if (!o.workspace) {
        const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
        if (currentWorkspace) {
          o.workspace = currentWorkspace.id
        }
      }
      const allOrders = Array.from(globalStore.get(ObjectStore('tag').objectMapAtom).values()).map(i => i.order ?? -1)
      o.order = Math.max(...allOrders) + 1
      return true
    },
    afterGetOneProcess: {
      onBeforeCache: obj => {
        const currWorkspace = KeyvalueStore.getOne('currentWorkspace')
        if (currWorkspace) {
          if (!obj.workspace || obj.workspace === currWorkspace.id) {
            return obj
          }
          return
        }
        return obj
      }
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
              { silent: true }
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
