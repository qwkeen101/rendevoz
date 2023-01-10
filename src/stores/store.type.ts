export interface IStore<T> {
  fetchOneById: (id: number) => Promise<T | undefined>
  getAll: () => Promise<boolean>
  getOneById: (id: number) => Promise<T | undefined>
  deleteOneById: (id: number) => Promise<boolean>
  addOne: (one: Partial<T>) => Promise<T>
  updateOne: (one: Partial<T> & { id: number }) => Promise<T | undefined>
}