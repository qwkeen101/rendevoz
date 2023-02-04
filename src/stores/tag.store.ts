import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import { ITag } from '~/typings/data'
import { initializeLocalStore } from './base.store'
import { IStore } from './store.type'

export const TagsAtom = atom<Map<number, ITag>>(new Map())

export const TagToTagAtom = atom<Map<string, ITag>>(get => {
  const map = new Map<string, ITag>()
  get(TagsAtom).forEach(i => {
    i.name && map.set(i.name, i)
  })
  return map
})
const useTagStore = () => {
  const database = useDb('tags')
  const store = initializeLocalStore(TagsAtom, database)
  const localStore: Pick<IStore<ITag>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
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

  return useMemo(
    () => ({
      ...realStore
    }),
    []
  )
}

export default useTagStore
