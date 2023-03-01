import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai'
import { IWhiteboard } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import { IStore } from './store.type'
import { globalStore } from '.'

export const whiteboardsAtom = atom(new Map<number, IWhiteboard>())
const { bulkAdd } = BaseStore
const useWhiteboardStore = () => {
  const whiteboardDb = useDb('whiteboards')
  const localWhiteboardStore = initializeLocalStore(whiteboardsAtom, whiteboardDb)
  const realWhiteboardStore: Pick<IStore<IWhiteboard>, 'addOne' | 'updateOne' | 'deleteOneById' | 'getAll' | 'getOneById'> = {
    addOne: localWhiteboardStore.addOne(),
    updateOne: localWhiteboardStore.updateOne(),
    deleteOneById: localWhiteboardStore.deleteOneById(),
    getAll: async () => {
      const arr = await whiteboardDb.toArray()
      const newArray = arr.map(i => {
        return {
          ...i,
          edges: new Map(i.edges.map(o => [o.id, o])),
          nodes: new Map(i.nodes.map(o => [o.id, o]))
        }
      })
      globalStore.set(whiteboardsAtom, bulkAdd(newArray, globalStore.get(whiteboardsAtom)))
      return true
    },
    getOneById: localWhiteboardStore.getOneById()
  }

  return {
    addWhiteboard: realWhiteboardStore.addOne,
    updateWhiteboard: realWhiteboardStore.updateOne,
    deleteWhiteboard: realWhiteboardStore.deleteOneById,
    getAllWhiteboard: realWhiteboardStore.getAll,
    getWhiteboardById: realWhiteboardStore.getOneById
  }
}

export const whiteboardStore = useWhiteboardStore()

export default useWhiteboardStore
