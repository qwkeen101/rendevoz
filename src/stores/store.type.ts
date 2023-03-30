import { PartialWithId } from '@/types'
import { INote, IWebpage } from '~/typings'

export interface IStoreDeprecated<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (id: number, silent?: boolean, force?: boolean) => Promise<boolean>
  addOne: (one: Partial<T>, silent?: boolean) => Promise<T>
  updateOne: (one: Partial<T> & { id: number }, silent?: boolean) => Promise<T | undefined>
}

export interface IStore<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (
    id: number,
    options?: {
      silent?: boolean
      force?: boolean
    }
  ) => Promise<boolean>
  addOne: (
    one: Partial<T>,
    options?:
      | {
          silent?: boolean
          preventAddMeta?: boolean
        } & (T extends INote
          ? {
              preventAddMeta?: boolean
            }
          : T extends IWebpage
          ? {
              showAddModal?: boolean
            }
          : {})
  ) => Promise<T>
  updateOne: (
    one: PartialWithId<T>,
    options?: {
      silent?: boolean
    }
  ) => Promise<T | undefined>
}
