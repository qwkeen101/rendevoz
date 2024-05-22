import Id from '@/utils/id'
import { Table } from 'dexie'
import produce, { createDraft, finishDraft, Patch } from 'immer'
import { Atom, PrimitiveAtom } from 'jotai/vanilla'
import { orderBy } from 'lodash'
import { IBase } from '~/typings/data'
import { Hooks } from 'rendevoz'
import { type PartialWithId } from '@/types'
import { immerWithDatabase } from '@/api/stores/immerWithDatabase'
import { IStore } from '~/typings'
const globalStore = Hooks.globalStore
const ATOM_QUEUE_MAP = new Map<Atom<any>, StoreDispatchEvent<any>[]>()

let historyStore: typeof import('./history.store') | undefined = undefined
import('./history.store').then(store => (historyStore = store))
type StoreDispatchEvent<T> = {
  atom: PrimitiveAtom<Map<number, T>>
  data: PartialWithId<T>
  database: Table
  onFail?: () => void
} & (
  | {
      type: 'add'
      onSuccess?: (o: T, silent?: boolean) => void
    }
  | {
      type: 'update'
      transformData?: (o: T) => T | undefined
      onSuccess?: (o: T, silent?: boolean) => void
    }
  | {
      type: 'remove'
      clearCache?: boolean
      onSuccess?: () => void
    }
  | {
      type: 'forceRemove'
      onSuccess?: () => void
    }
)

const handleQueue = () => {
  console.log('handle queue')
  const DB_ACTION_MAP = new Map<Table, Patch[]>()
  Array.from(ATOM_QUEUE_MAP.entries()).forEach(([k, v]) => {
    const atomValue = globalStore.get(k)
    const draft = createDraft(atomValue)
    v.forEach(i => {
      const { data, onFail } = i as StoreDispatchEvent<any>
      switch (i.type) {
        case 'add':
          draft.set(data.id, data)
          setTimeout(() => i.onSuccess?.(data))
          return
        case 'update': {
          // first get from atom, if not exist, get from database
          if (!atomValue.has(data.id)) {
            onFail?.()
            return
          }
          const origin = draft.get(data.id)
          let newObj = Object.assign({}, origin, data, {
            updatedAt: Date.now()
          })
          if (i.transformData) {
            newObj = i.transformData(newObj)
          }
          if (!newObj) {
            return
          }
          draft.set(data.id, newObj)
          setTimeout(() => i.onSuccess?.(newObj))
          return
        }
        case 'forceRemove': {
          draft.delete(data.id)
          setTimeout(() => i.onSuccess?.())
          return
        }
        case 'remove': {
          if (i.clearCache) {
            draft.delete(data.id)
          } else {
            const origin = atomValue.get(data.id)
            const newObj = Object.assign({}, origin, { deleted: true, deletedAt: Date.now() })
            draft.set(data.id, newObj)
          }
          setTimeout(() => i.onSuccess?.())
          return
        }
      }
    })
    const newAtom = finishDraft(draft, (patches, inversePatches) => {
      const { database } = v[0]
      const dbName = database.name
      historyStore?.finishProcess(patches, inversePatches, k, dbName)
      DB_ACTION_MAP.set(database, patches)
    })
    globalStore.set(k, newAtom)
    ATOM_QUEUE_MAP.delete(k)
  })
  setTimeout(() => {
    Array.from(DB_ACTION_MAP.entries()).forEach(([k, v]) => {
      immerWithDatabase(v, k.name)
      DB_ACTION_MAP.delete(k)
    })
  })
}

const BaseStore = {
  clear(data: Map<number, any>) {
    return produce(data, draft => {
      draft.clear()
    })
  },
  add(item: PartialWithId<any>, data: Map<number, any>) {
    return produce(data, draft => {
      draft.set(item.id, item)
    })
  },
  update(item: PartialWithId<any>, data: Map<number, any>) {
    return produce(data, draft => {
      draft.set(item.id, item)
    })
  },
  bulkAdd(items: PartialWithId<any>[], data: Map<number, any>) {
    return produce(data, draft => {
      items.forEach(i => draft.set(i.id, i))
    })
  },
  buldRemove(ids: number[], data: Map<number, any>) {
    return produce(data, draft => {
      ids.forEach(i => {
        draft.delete(i)
      })
    })
  },
  dispatch<T>({ type, atom, data, database, onSuccess, onFail, ...rest }: StoreDispatchEvent<T>) {
    if (!ATOM_QUEUE_MAP.has(atom)) {
      ATOM_QUEUE_MAP.set(atom, [])
      const queue = ATOM_QUEUE_MAP.get(atom)
      queue?.push({
        type,
        atom,
        data,
        database,
        onSuccess,
        onFail,
        ...rest
      })
      Promise.resolve().then(() => {
        handleQueue()
      })
    } else {
      const queue = ATOM_QUEUE_MAP.get(atom)
      queue?.push({
        type,
        atom,
        data,
        database,
        onSuccess,
        onFail,
        ...rest
      })
    }
  },
  remove(id: number, data: Map<number, any>) {
    return produce(data, draft => {
      draft.delete(id)
    })
  },
  get<T>(id: number | undefined, data: Map<number, T>): T | undefined {
    if (id) {
      return data.get(id)
    }
  },
  orderedData<T>(data: Map<number, T>): T[] {
    return orderBy(Array.from(data.values()), 'createdAt', 'desc')
  },
  orderedArray<T extends IBase>(data: T[]): T[] {
    return data.sort((a, b) => b.createdAt - a.createdAt)
  },
  initBaseObject<T extends Partial<IBase>>(obj: T): PartialWithId<T> {
    return {
      ...obj,
      id: obj.id || Id.getId(),
      updatedAt: Date.now(),
      createdAt: Date.now()
    }
  }
}

type ILocalStore<T> = {
  fetchOneById: (id: number) => Promise<T | undefined>
  addOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['addOne']
  deleteOneById: (onSuccess?: (silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['deleteOneById']
  getAll: (filterer?: (obj: T) => boolean, cacheFilter?: (obj: T) => boolean) => IStore<T>['getAll']
  getOneById: (opts?: { forceRefresh?: boolean }) => IStore<T>['getOneById']
  getMultipleByIds: () => (ids: number[], cache?: boolean) => Promise<T[]>
  updateOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['updateOne']
}
export function initializeLocalStore<T>(
  atom: PrimitiveAtom<Map<number, T>>,
  database: Table,
  outOptions: {
    transformData?: (o: T) => T | undefined
  }
) {
  const store: ILocalStore<T> = {
    addOne: (onSuccess, onFail) => (obj, options) => {
      return new Promise(res => {
        let initedObj = BaseStore.initBaseObject(obj)
        initedObj = outOptions?.transformData ? outOptions?.transformData(initedObj) : initedObj
        if (!initedObj) {
          return
        }
        BaseStore.dispatch<T>({
          type: 'add',
          data: initedObj,
          database,
          atom,
          onSuccess: o => {
            res(o)
            onSuccess?.(o, options?.silent ?? false)
          },
          onFail: () => onFail?.(options?.silent ?? false)
        })
      })
    },
    fetchOneById: async id => {
      return await database.get(id)
    },
    deleteOneById: (onSuccess, onFail) => (id, options) => {
      return new Promise(res => {
        BaseStore.dispatch({
          type: options?.force ? 'forceRemove' : 'remove',
          data: { id },
          database,
          atom,
          clearCache: options?.clearCache,
          onSuccess: () => {
            res(true)
            onSuccess?.(options?.silent ?? false)
          },
          onFail: () => onFail?.(options?.silent ?? false)
        })
      })
    },
    getAll: (filterer, cacheFilter) => async () => {
      const arr = await database.toArray()
      const filtered = (filterer ? arr.filter(i => filterer(i)) : arr).map(o =>
        outOptions?.transformData ? outOptions.transformData(o) : o
      )
      if (cacheFilter) {
        globalStore.set(
          atom,
          BaseStore.bulkAdd(
            filtered.filter(o => cacheFilter(o)),
            globalStore.get(atom)
          )
        )
      } else {
        globalStore.set(atom, BaseStore.bulkAdd(filtered, globalStore.get(atom)))
      }

      return filtered
    },
    getMultipleByIds:
      () =>
      async (ids, cache = true) => {
        const map = globalStore.get(atom)
        const allInCache = ids.every(id => map.has(id))
        if (allInCache) {
          return ids.map(id => map.get(id)) as T[]
        }
        const arr = (await database.bulkGet(ids)).map(i => (outOptions?.transformData ? outOptions.transformData(i) : i))
        if (cache) {
          globalStore.set(atom, BaseStore.bulkAdd(arr, globalStore.get(atom)))
        }
        return arr as T[]
      },
    getOneById: opts => id => {
      return new Promise(res => {
        const atomOne = globalStore.get(atom).get(id)
        if (!opts?.forceRefresh && atomOne) {
          res(atomOne)
        } else {
          database.get(id).then(one => {
            if (one) {
              one = outOptions?.transformData ? outOptions?.transformData?.(one) : one
              if (!one) {
                res(undefined)
                return
              }
              globalStore.set(atom, BaseStore.add(one, globalStore.get(atom)))
              res(one)
            } else {
              res(undefined)
            }
          })
        }
      })
    },
    updateOne: (onSuccess, onFail) => (obj, options) => {
      return new Promise(res => {
        if (globalStore.get(atom).has(obj.id)) {
          BaseStore.dispatch({
            type: 'update',
            atom,
            database,
            data: obj,
            transformData: outOptions?.transformData,
            onSuccess: obj => {
              res(obj)
              onSuccess?.(obj, options?.silent ?? false)
            },
            onFail: () => onFail?.(options?.silent ?? false)
          })
        } else {
          database.get(obj.id).then(data => {
            data = outOptions?.transformData ? outOptions.transformData(data) : data
            globalStore.set(atom, BaseStore.add(data, globalStore.get(atom)))
            BaseStore.dispatch({
              type: 'update',
              data: obj,
              atom,
              database,
              onSuccess: obj => {
                res(obj)
                onSuccess?.(obj, options?.silent ?? false)
              },
              onFail: () => onFail?.(options?.silent ?? false)
            })
          })
        }
      })
    }
  }
  return store as ILocalStore<T>
}

export default BaseStore
