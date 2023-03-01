export interface IStore<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (id: number, silent?: boolean, force?: boolean) => Promise<boolean>
  addOne: (one: Partial<T>, silent?: boolean) => Promise<T>
  updateOne: (one: Partial<T> & { id: number }, silent?: boolean) => Promise<T | undefined>
}
