import useDb from '@/hooks/stores/useDb'
import { atom } from 'jotai'
import { orderBy } from 'lodash'
import { ICollection, ICollectionItem } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import produce from 'immer'
import { IStore } from './store.type'
import { toast } from 'react-hot-toast'
import { globalStore } from '.'
import getSetting from '@/components/setting/getSetting'
import useWhiteboardStore from './whiteboard.store'

const { orderedData } = BaseStore

export const collectionsAtom = atom<Map<number, ICollection>>(new Map())

const undeletedCollectionsAtom = atom(get => orderedData(get(collectionsAtom)).filter(i => !i.deleted))

export const pinnedCollectionsAtom = atom(get => get(undeletedCollectionsAtom).filter(i => i.pinned))

export const rootCollectionsAtom = atom(get =>
  orderBy(
    get(undeletedCollectionsAtom).filter(i => i.parentId === 0),
    'updatedAt',
    'desc'
  )
)
const useCollectionStore = () => {
  const database = useDb('collections')
  const { getWhiteboardById, updateWhiteboard } = useWhiteboardStore()
  const shouldToast = (silent?: boolean) => {
    const setting = getSetting()
    if (setting.notification.enabled && setting.notification.collection && !silent) {
      return true
    } else {
      return false
    }
  }
  const store = initializeLocalStore<ICollection>(collectionsAtom, database)
  const localStore: Pick<IStore<ICollection>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne((obj, silent) => {
      !silent && shouldToast(silent) && toast.success('Collection successfully added!')
    }),
    updateOne: store.updateOne((obj, silent) => {
      !silent && shouldToast(silent) && toast.success('Collection successfully updated!')
    }),
    deleteOneById: store.deleteOneById(silent => {
      !silent && shouldToast(silent) && toast.success('Collection successfully deleted!')
    }),
    getAll: store.getAll(),
    getOneById: store.getOneById()
  }
  const realStore = {
    addCollection: localStore.addOne,
    deleteCollection: localStore.deleteOneById,
    updateCollection: localStore.updateOne,
    getAllCollections: localStore.getAll,
    getCollectionById: localStore.getOneById
  }

  const addItemToCollection = (item: ICollectionItem, collectionId: number) => {
    const origin = structuredClone(globalStore.get(collectionsAtom).get(collectionId)) as ICollection
    origin.items = origin.items || []
    origin.items.push(item)
    realStore.updateCollection(origin, true)
  }

  const moveItems = async (options: {
    sourceFromId: number
    sourceFromType: 'whiteboard' | 'collection'
    sourceIsRoot: boolean
    targetToId: number
    targetToType: 'whiteboard' | 'collection'
    targetIsRoot: boolean
    item: ICollectionItem
  }) => {
    const { sourceFromId, sourceFromType, sourceIsRoot, targetIsRoot, targetToId, targetToType, item } = options
    const { id: itemId, type: itemType } = item
    if (!itemId || !itemType || sourceFromId === targetToId || (sourceIsRoot && targetIsRoot)) return
    if (targetToType === 'whiteboard') {
      toast.error('You can not move items into whiteboard!')
      return
    }
    // move source level collection to somewhere else
    let target
    if (targetToType === 'collection') {
      if (!targetIsRoot) {
        target = (await realStore.getCollectionById(targetToId)) as ICollection
        const newTarget = produce(target, draft => {
          draft.items = draft.items || []
          !draft.items.some(i => i.id === item.id) && draft.items.push(item)
        })
        realStore.updateCollection(newTarget)
      }
      if (itemType === 'collection') {
        const movingCollection = await realStore.getCollectionById(itemId)
        if (!movingCollection) return
        const newMovingCollection = produce(movingCollection, draft => {
          draft.parentId = targetIsRoot ? 0 : targetToId
        })
        realStore.updateCollection(newMovingCollection)
      }
    }

    if (sourceIsRoot && itemType === 'collection' && targetToType === 'collection') {
      realStore.updateCollection(
        {
          id: itemId,
          parentId: targetToId
        },
        true
      )
      return
    }
    if (sourceFromType === 'collection') {
      const sourceCollection = await getCollectionById(sourceFromId)
      if (!sourceCollection) return
      const newSource = produce(sourceCollection, draft => {
        draft.items = draft.items?.filter(i => i.id !== itemId)
      })
      realStore.updateCollection(newSource, true)
    }
    if (sourceFromType === 'whiteboard') {
      const sourceWhiteboard = await getWhiteboardById(sourceFromId)
      if (!sourceWhiteboard) return
      const newSourceWhiteboard = produce(sourceWhiteboard, draft => {
        draft.items = draft.items?.filter(i => i.id !== item.id)
      })
      updateWhiteboard(newSourceWhiteboard, true)
    }
  }
  const moveItemBetweenCollections = async (item: ICollectionItem, sourceCollectionId: number, targetCollectionId: number) => {
    const sourceIsRoot = sourceCollectionId === 1
    const targetIsRoot = targetCollectionId === 1
    if (sourceCollectionId === targetCollectionId) return
    if (sourceIsRoot) {
      realStore.updateCollection(
        {
          id: item.id,
          parentId: targetCollectionId
        },
        true
      )
      const targetCollection = await getCollectionById(targetCollectionId)
      const newTarget = produce(targetCollection, draft => {
        draft.items = draft.items || []
        !draft.items.some(i => i.id === item.id) && draft.items.push(item)
      })
      realStore.updateCollection(newTarget)
    } else {
      const sourceCollection = await getCollectionById(sourceCollectionId)
      const newSource = produce(sourceCollection, draft => {
        draft.items = draft.items || []
        draft.items = draft.items.filter(i => i.id !== item.id)
      })
      if (targetIsRoot) {
        if (item.type === 'collection') {
          const movingCollection = await getCollectionById(item.id)
          const newMovingCollection = produce(movingCollection, draft => {
            draft.parentId = 0
          })
          realStore.updateCollection(newSource, true)
          realStore.updateCollection(newMovingCollection)
          return
        }
      }

      const targetCollection = await getCollectionById(targetCollectionId)
      const newTarget = produce(targetCollection, draft => {
        draft.items = draft.items || []
        !draft.items.some(i => i.id === item.id) && draft.items.push(item)
      })
      realStore.updateCollection(newSource, true)
      realStore.updateCollection(newTarget)
    }
  }

  const getCollectionById = (collectionId: number): Promise<ICollection> => {
    const collection = globalStore.get(collectionsAtom).get(collectionId)
    if (collection) return Promise.resolve(collection)
    return new Promise((resolve, reject) => {
      database.get(collectionId).then(c => {
        if (c) {
          resolve(c)
          realStore.addCollection(c)
        } else {
          reject("Collection don't exist!")
        }
      })
    })
  }
  const findParentCollections = async (collectionId: number) => {
    const collection = await realStore.getCollectionById(collectionId)
    if (!collection) return
    let innerCollection = collection
    const parentCollectionsList = [collection]
    while (innerCollection?.parentId !== 0) {
      const parent = globalStore.get(collectionsAtom).get(innerCollection.parentId)
      if (parent && innerCollection !== parent) {
        innerCollection = parent
        parentCollectionsList.unshift(parent)
      } else {
        throw new Error('no parent collection found!')
      }
    }
    return parentCollectionsList
  }

  return {
    findParentCollections,
    addItemToCollection,
    moveItemBetweenCollections,
    moveItems,
    ...realStore
  }
}

export const collectionStore = useCollectionStore()

export default useCollectionStore
