import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai/vanilla'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { ILabel } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import { IStore } from './store.type'

const { orderedData } = BaseStore

export const labelsAtom = atom<Map<number, ILabel>>(new Map<number, ILabel>())

export const allLabelsAtom = atom(get => orderedData(get(labelsAtom)))
export const documentIdToLabelsMapAtom = atom(get => {
  const map = new Map<number, Set<number>>()
  const allLabels = get(allLabelsAtom)
  allLabels.forEach(i => {
    if (i.documentId && i.id) {
      const set = map.get(i.documentId)
      if (set) {
        set.add(i.id)
      } else {
        const set = new Set<number>()
        set.add(i.id)
        map.set(i.documentId, set)
      }
    }
  })
  return map
})
const useLabelStore = () => {
  const database = useDb('labels')
  const store = initializeLocalStore<ILabel>(labelsAtom, database)
  const localStore: Pick<IStore<ILabel>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne((obj, silent) => {
      !silent && toast.success('Label successfully added!')
    }),
    updateOne: store.updateOne((obj, silent) => {
      !silent && toast.success('Label successfully updated!')
    }),
    deleteOneById: store.deleteOneById(silent => {
      !silent && toast.success('Label successfully deleted!')
    }),
    getAll: store.getAll(),
    getOneById: store.getOneById()
  }
  const realStore = {
    addLabel: localStore.addOne,
    deleteLabel: localStore.deleteOneById,
    updateLabel: localStore.updateOne,
    getAllLabels: localStore.getAll,
    getLabelById: localStore.getOneById
  }

  return useMemo(
    () => ({
      ...realStore
    }),
    []
  )
}

export default useLabelStore
