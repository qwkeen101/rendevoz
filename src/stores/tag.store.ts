import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai/vanilla'
import { ITag } from '~/typings/data'
import { initializeLocalStore } from './base.store'
import { IStoreDeprecated } from './store.type'
import { ObjectStore } from '.'

export const TagsAtom = atom<Map<number, ITag>>(new Map())

export const TagToTagAtom = atom<Map<string, ITag>>(get => {
  const map = new Map<string, ITag>()
  get(ObjectStore('tag').objectMapAtom).forEach(i => {
    i.name && map.set(i.name, i)
  })
  return map
})
const createTagStore = () => {
  const database = useDb('tags')
  const store = initializeLocalStore(TagsAtom, database)
  const localStore: Pick<IStoreDeprecated<ITag>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne(),
    deleteOneById: store.deleteOneById(),
    getAll: store.getAll(),
    getOneById: store.getOneById(),
    updateOne: store.updateOne()
  }
  const realStore = {
    addTag: localStore.addOne,
    deleteTag: localStore.deleteOneById,
    getAllTags: localStore.getAll,
    getTagById: localStore.getOneById,
    updateTag: localStore.updateOne
  }

  return {
    ...realStore
  }
}

export const tagStore = createTagStore()

export default createTagStore
