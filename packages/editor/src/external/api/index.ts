export type Atom<T = any> = { initialValue?: T }

export const globalStore = {
  _store: new Map<any, any>(),
  get: <T>(atom: Atom<T>) => globalStore._store.get(atom) ?? atom.initialValue,
  set: <T>(atom: Atom<T>, value: T) => {
    globalStore._store.set(atom, value)
  }
}

export const MetaStore: any = (_type?: string) => ({
  addListener: () => {},
  removeListener: () => {},
  getOneById: async (_id: number) => undefined,
  updateOne: async (_payload: any) => undefined,
  useValue: (_id?: number) => undefined,
  subscribe: () => () => {}
})
Object.assign(MetaStore, {
  useValue: (_id?: number) => undefined,
  isVisibleMetaObject: () => false,
  getCachedMetaObject: (_id?: number) => undefined,
  getMetaObjectsMap: () => new Map(),
  getMetaObjectById: async (_id: number) => undefined,
  addMetaLink: (_payload?: any) => {},
  getMetaLinkBySourceAndTarget: (_s?: number, _t?: number) => undefined
})

export const ObjectStore = MetaStore
export const NoteStore = MetaStore

export default {
  globalStore,
  MetaStore,
  ObjectStore,
  NoteStore
}
