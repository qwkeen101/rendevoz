import Id from '@/utils/id'
import { Table } from 'dexie'
import produce from 'immer'
import { PrimitiveAtom } from 'jotai/vanilla'
import { Atom } from 'jotai/vanilla'
import _ from 'lodash'
import { orderBy } from 'lodash'
import { IBase } from '~/typings/data'
import { IStore } from './store.type'
import { globalStore } from '.'
import { getUser } from '@/services/login.service'
import { toast } from 'react-hot-toast'

type PartialWithId<T> = Partial<T> & { id: number }

const ATOM_QUEUE_MAP = new Map<Atom<any>, StoreDispatchEvent<any>[]>()
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
  const DB_ACTION_MAP = new Map<Table, any[]>()
  Array.from(ATOM_QUEUE_MAP.entries()).forEach(([k, v]) => {
    const atomValue = globalStore.get(k)
    const newAtom = produce(atomValue, draft => {
      v.forEach(i => {
        const { type, data, database, onSuccess, onFail } = i
        if (!DB_ACTION_MAP.has(database)) {
          DB_ACTION_MAP.set(database, [])
        }
        const dbActionArr = DB_ACTION_MAP.get(database)!
        switch (type) {
          case 'add':
            draft.set(data.id, data)
            dbActionArr.push(i)
            setTimeout(() => onSuccess?.(data))
            break
          case 'update': {
            if (!draft.has(data.id)) {
              onFail?.()
              break
            }
            const origin = draft.get(data.id)
            const newObj = Object.assign({}, origin, data)
            if (_.isEqual(origin, newObj)) break
            draft.set(data.id, newObj)
            dbActionArr.push({
              ...i,
              data: newObj
            })
            setTimeout(() => onSuccess?.(newObj))
            break
          }
          case 'forceRemove': {
            draft.delete(data.id)
            dbActionArr.push({
              ...i
            })
            setTimeout(() => onSuccess?.())
            break
          }
          case 'remove': {
            const origin = atomValue.get(data.id)
            const newObj = Object.assign({}, origin, { deleted: true })
            draft.set(data.id, newObj)
            dbActionArr.push({
              ...i,
              data: newObj
            })
            setTimeout(() => onSuccess?.())
            break
          }
        }
      })
    })
    globalStore.set(k, newAtom)
    ATOM_QUEUE_MAP.delete(k)
  })

  Array.from(DB_ACTION_MAP.entries()).forEach(([k, v]) => {
    // const putActionData = v.filter(i => i.type === 'add' || i.type === 'update').map(i => i.data)
    // const removeActionData = v.filter(i => i.type === 'remove').map(i => i.data.id)
    const forceRemoveActionData = v.filter(i => i.type === 'forceRemove').map(i => i.data.id)
    const putActionData = v
      .filter(i => i.type === 'add' || i.type === 'update' || i.type === 'remove')
      .map(i => {
        const newData: Record<string, unknown> = {}
        Object.entries(i.data).map(([k, v]) => {
          if (v instanceof Map) {
            newData[k] = Array.from(v.values())
          } else {
            newData[k] = v
          }
        })
        return newData
      })
    putActionData.length > 0 && k.bulkPut(putActionData)
    forceRemoveActionData.length > 0 && k.bulkDelete(forceRemoveActionData)
    DB_ACTION_MAP.delete(k)
    // removeActionData.length > 0 && k.bulkDelete(removeActionData)
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
  addOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['addOne']
  deleteOneById: (onSuccess?: (silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['deleteOneById']
  getAll: () => IStore<T>['getAll']
  getOneById: () => IStore<T>['getOneById']
  updateOne: (onSuccess?: (obj: T, silent: boolean) => void, onFail?: (silent: boolean) => void) => IStore<T>['updateOne']
}
export function initializeLocalStore<T>(atom: PrimitiveAtom<Map<number, T>>, database: Table) {
  const { dispatch, initBaseObject, bulkAdd } = BaseStore
  const store: ILocalStore<T> = {
    addOne:
      (onSuccess, onFail) =>
      (obj, silent = false) => {
        return new Promise(res => {
          const user = getUser()
          if (!user?.isPremium) {
            toast.error('You can only add items after upgrading to premium!')
            return
          }
          if (user.disabled) {
            toast.error('Your account has been disabled! Please contact us if you want to recover!')
            return
          }
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
    getAll: () => async () => {
      const arr = await database.toArray()
      globalStore.set(atom, bulkAdd(arr, globalStore.get(atom)))
      return true
    },
    getOneById: () => id => {
      return new Promise(res => {
        res(globalStore.get(atom).get(id))
      })
    },
    updateOne:
      (onSuccess, onFail) =>
      (obj, silent = false) => {
        return new Promise(res => {
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
  }
  return store as ILocalStore<T>
}

export default BaseStore
