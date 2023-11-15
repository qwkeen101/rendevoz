import { PartialWithId } from '@/types'
import { INote, IWebpage, MetaObject } from '~/typings'

export interface IStoreDeprecated<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getAllData: () => Promise<T[]>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (id: number, silent?: boolean, force?: boolean) => Promise<boolean>
  addOne: (one: Partial<T>, silent?: boolean, overPremium?: boolean) => Promise<T>
  updateOne: (one: Partial<T> & { id: number }, silent?: boolean) => Promise<T | undefined>
}

export interface IStore<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getAllData: () => Promise<T[]>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (
    id: number,
    options?: {
      silent?: boolean
      force?: boolean
      deleteMeta?: boolean
    }
  ) => Promise<boolean>
  addOne: (
    one: Partial<T>,
    options?: {
      silent?: boolean
      overPremium?: boolean
      preventAddMeta?: boolean
    } & (T extends INote
      ? {
          preventAddMeta?: boolean
        }
      : T extends IWebpage
      ? {}
      : {})
  ) => Promise<T>
  addOneWithMeta: (
    one: Parameters<IStore<T>['addOne']>['0'],
    options?: Parameters<IStore<T>['addOne']>['1'] & {
      showMetaModal?: boolean
      currentMeta?: Partial<MetaObject>
    }
  ) => Promise<{
    one: T
    meta: MetaObject
  }>
  updateOne: (
    one: PartialWithId<T>,
    options?: {
      silent?: boolean
    }
  ) => Promise<T | undefined>
}

export type LocalDatabaseAction = (
  | {
      type: 'forceRemove'
    }
  | {
      type: 'add'
    }
  | {
      type: 'update'
    }
  | {
      type: 'remove'
    }
) & {
  data: PartialWithId<any>
  tableName: string
}
