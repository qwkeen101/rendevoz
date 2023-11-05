import Id from '@/utils/id'
import { Table } from 'dexie'
import produce, { createDraft, finishDraft, Patch } from 'immer'
import { Atom, PrimitiveAtom } from 'jotai/vanilla'
import { orderBy } from 'lodash'
import { IBase } from '~/typings/data'
import { type IStoreDeprecated, LocalDatabaseAction } from './types'
import { globalStore } from '.'
import { type PartialWithId } from '@/types'
import { immerWithDatabase } from '@/stores/immerWithDatabase'

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
      onSuccess?: (o: T, silent?: boolean) => void
    }
  | {
      type: 'remove'
      onSuccess?: (silent?: boolean) => void
    }
  | {
      type: 'forceRemove'
      onSuccess?: (silent?: boolean) => void
    }
)

const handleQueue = () => {
  console.log('handle queue')
  const DB_ACTION_MAP = new Map<Table, Patch[]>()
  Array.from(ATOM_QUEUE_MAP.entries()).forEach(([k, v]) => {
    const atomValue = globalStore.get(k)
    const draft = createDraft(atomValue)
    v.forEach(i => {
      const { type, data, onSuccess, onFail } = i
      switch (type) {
        case 'add':
          draft.set(data.id, data)
          setTimeout(() => onSuccess?.(data))
          return
        case 'update': {
          // first get from atom, if not exist, get from database
          if (!atomValue.has(data.id)) {
            onFail?.()
            return
          }
          const origin = draft.get(data.id)
          const newObj = Object.assign({}, origin, data, {
            updatedAt: Date.now()
          })
          draft.set(data.id, newObj)
          setTimeout(() => onSuccess?.(newObj))
          return
        }
        case 'forceRemove': {
          draft.delete(data.id)
          setTimeout(() => onSuccess?.())
          return
        }
        case 'remove': {
          const origin = atomValue.get(data.id)
          const newObj = Object.assign({}, origin, { deleted: true })
          draft.set(data.id, newObj)
          setTimeout(() => onSuccess?.())
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
      console.log(v, k)
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
  dispatch<T>({ type, atom, data, database, onSuccess, onFail }: StoreDispatchEvent<T>) {
    if (!ATOM_QUEUE_MAP.has(atom)) {
      ATOM_QUEUE_MAP.set(atom, [])
      const queue = ATOM_QUEUE_MAP.get(atom)
      queue?.push({
        type,
        atom,
        data,
        database,
        onSuccess,
        onFail
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
        onFail
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
  addOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStoreDeprecated<T>['addOne']
  deleteOneById: (onSuccess?: (silent: boolean) => void, onFail?: (silent: boolean) => void) => IStoreDeprecated<T>['deleteOneById']
  getAll: (filterer?: (obj: T) => boolean) => IStoreDeprecated<T>['getAll']
  getAllData: (filterer?: (obj: T) => boolean) => IStoreDeprecated<T>['getAllData']
  getOneById: () => IStoreDeprecated<T>['getOneById']
  updateOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStoreDeprecated<T>['updateOne']
}
export function initializeLocalStore<T>(atom: PrimitiveAtom<Map<number, T>>, database: Table) {
  const { dispatch, initBaseObject, bulkAdd } = BaseStore
  const store: ILocalStore<T> = {
    addOne:
      (onSuccess, onFail) =>
      (obj, silent = false, overPremium = false) => {
        return new Promise(res => {
          const initedObj = initBaseObject(obj)
          dispatch<T>({
            type: 'add',
            data: initedObj,
            database,
            atom,
            onSuccess: o => {
              res(o)
              onSuccess?.(o, silent)
            },
            onFail: () => onFail?.(silent)
          })
        })
      },
    deleteOneById:
      (onSuccess, onFail) =>
      (id, silent = false, force = false) => {
        return new Promise(res => {
          dispatch({
            type: force ? 'forceRemove' : 'remove',
            data: { id },
            database,
            atom,
            onSuccess: () => {
              res(true)
              onSuccess?.(silent)
            },
            onFail: () => onFail?.(silent)
          })
        })
      },
    getAll: filterer => async () => {
      const arr = await database.toArray()
      const filtered = filterer ? arr.filter(i => filterer(i)) : arr
      globalStore.set(atom, bulkAdd(filtered, globalStore.get(atom)))
      return true
    },
    getAllData: filterer => async () => {
      const arr = await (filterer ? database.filter(filterer).toArray() : database.toArray())
      return arr
    },
    getOneById: () => id => {
      return new Promise(res => {
        const atomOne = globalStore.get(atom).get(id)
        if (atomOne) {
          res(atomOne)
        } else {
          database.get(id).then(one => {
            if (one) {
              globalStore.set(atom, BaseStore.add(one, globalStore.get(atom)))
              res(one)
            } else {
              res(undefined)
            }
          })
        }
      })
    },
    updateOne:
      (onSuccess, onFail) =>
      (obj, silent = false) => {
        return new Promise(res => {
          if (globalStore.get(atom).has(obj.id)) {
            console.log(obj)
            dispatch({
              type: 'update',
              data: obj,
              atom,
              database,
              onSuccess: obj => {
                res(obj)
                onSuccess?.(obj, silent)
              },
              onFail: () => onFail?.(silent)
            })
          } else {
            database.get(obj.id).then(data => {
              globalStore.set(atom, BaseStore.add(data, globalStore.get(atom)))
              dispatch({
                type: 'update',
                data: obj,
                atom,
                database,
                onSuccess: obj => {
                  res(obj)
                  onSuccess?.(obj, silent)
                },
                onFail: () => onFail?.(silent)
              })
            })
          }
        })
      }
  }
  return store as ILocalStore<T>
}

export default BaseStore
