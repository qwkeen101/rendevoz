import getLocalTable from '@/api/stores/getLocalTable'
import { atom } from 'jotai'
import { debounce, orderBy } from 'lodash'
import { ICollection, ICollectionItem } from '~/typings/data'
import BaseStore, { initializeLocalStore } from './base.store'
import produce from 'immer'
import { IStore, IStoreDeprecated } from './types'
import { toast } from 'react-hot-toast'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './index'
import getSetting from '@/core/setting/getSetting'
import { useMemo } from 'react'
import { useSelectGlobalAtomValue } from '@/hooks'
import { metaObjectsAtom } from '@/api/stores/meta/meta.store'
import KeyvalueStore from '@/api/stores/keyvalue.store'

export const collectionsAtom = atom<Map<number, ICollection>>(new Map())

const undeletedCollectionsAtom = atom(get => BaseStore.orderedData(get(collectionsAtom)).filter(i => !i.deleted))

export const pinnedCollectionsAtom = atom(get => get(undeletedCollectionsAtom).filter(i => i.pinned))

export const rootCollectionsAtom = atom(get =>
  orderBy(
    get(undeletedCollectionsAtom).filter(i => i.parentId === 0),
    'updatedAt',
    'desc'
  )
)

type TreeCollection = ICollection & { children: ICollection[] }

function list_to_tree(list: ICollection[]): {
  list: TreeCollection[]
} {
  list.sort(b => (b.parentId === 0 ? -1 : 1))
  let map = {},
    node,
    roots = [],
    i

  for (i = 0; i < list.length; i += 1) {
    map[list[i].id] = i // initialize the map
    list[i] = {
      ...list[i],
      children: []
    } // initialize the children
  }

  for (i = 0; i < list.length; i += 1) {
    node = list[i]
    if (node.parentId !== 0) {
      // if you have dangling branches check that map[node.parentId] exists
      list[map[node.parentId]]?.children.push(node)
    } else {
      roots.push(node)
    }
  }
  return {
    roots,
    list
  }
}
const useCollectionStore = () => {
  const database = getLocalTable('collections')
  const store = initializeLocalStore<ICollection>(collectionsAtom, database)
  const localStore: Pick<IStore<ICollection>, 'addOne' | 'deleteOneById' | 'getAll' | 'getOneById' | 'updateOne'> = {
    addOne: store.addOne(obj => {
      if (!obj.workspace) {
        CollectionStore.updateCollection({ id: obj.id, workspace: KeyvalueStore.getOne('currentWorkspace')?.id })
      }
    }),
    updateOne: store.updateOne(),
    deleteOneById: store.deleteOneById(),
    getAll: store.getAll(i => i.workspace === KeyvalueStore.getOne('currentWorkspace')?.id),
    getOneById: store.getOneById()
  }
  const findNestedCollections = (
    collectionId: number
  ): {
    collections: number[]
    metas: number[]
  } => {
    const allCollectionIds: number[] = []
    const allMetaIds: number[] = []
    const allCollections = globalStore.get(collectionsAtom)
    const { list } = list_to_tree(Array.from(allCollections.values()))
    const root = list.find(i => i.id === collectionId)
    const loop = (root: TreeCollection) => {
      allCollectionIds.push(root.id)
      root.items?.forEach(i => {
        if (i.type === 'meta' && i.id) {
          allMetaIds.push(i.id)
        }
      })
      root.children.forEach(i => {
        loop(i)
      })
    }
    if (root) {
      loop(root)
    }
    return {
      collections: allCollectionIds,
      metas: allMetaIds
    }
  }
  const deleteCollection = (collectionId: number, deleteMeta?: boolean) => {
    const { collections, metas } = findNestedCollections(collectionId)
    collections.forEach(id => {
      localStore.deleteOneById(id, true, true)
    })
    if (deleteMeta) {
      metas.forEach(id => {
        MetaStore.deleteMetaObject(id)
      })
    }
  }
  const realStore = {
    addCollection: localStore.addOne,
    deleteCollection: deleteCollection,
    updateCollection: localStore.updateOne,
    getAllCollections: localStore.getAll,
    getCollectionById: localStore.getOneById
  }

  const addItemToCollection = async (item: ICollectionItem | ICollectionItem[], collectionId: number) => {
    console.log(item, collectionId)

    const items = Array.isArray(item) ? item : [item]
    const collectionGroup = await KeyvalueStore.getOne(`collection_${collectionId}_group`)
    if (collectionGroup) {
      if (collectionGroup.hideObjectsInside) {
        const metas = items.filter(i => i.type === 'meta').map(i => i.id)
        metas.forEach(id => id && MetaStore.updateMetaObject({ id: id, hidden: true }, { silent: true }))
      }
    }
    const origin = structuredClone(globalStore.get(collectionsAtom).get(collectionId)) as ICollection
    origin.items = origin.items || []
    if (origin.items.some(i => items.some(o => o.id === i.id))) return
    items.forEach(item => {
      origin.items?.push(item)
    })
    console.log(origin)
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
      const sourceWhiteboard = await ObjectStore('whiteboard').getOneById(sourceFromId)
      if (!sourceWhiteboard) return
      const newSourceWhiteboard = produce(sourceWhiteboard, draft => {
        draft.items = draft.items?.filter(i => i.id !== item.id)
      })
      ObjectStore('whiteboard').updateOne(newSourceWhiteboard, {
        silent: true
      })
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
  const findParentCollections = (collectionId: number) => {
    const collection = globalStore.get(collectionsAtom).get(collectionId)
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
  const switchWorkspace = () => {
    globalStore.set(collectionsAtom, new Map())
    realStore.getAllCollections()
  }
  const getCachedCollectionById = (id: number) => {
    return globalStore.get(collectionsAtom).get(id)
  }
  const refreshFromDB = async (id: number) => {
    const v = await database.get(id)
    if (v) {
      globalStore.set(collectionsAtom, BaseStore.update(v, globalStore.get(collectionsAtom)))
    }
  }
  const clearAtomData = () => {
    globalStore.set(collectionsAtom, new Map())
  }
  return {
    clearAtomData,
    refreshFromDB,
    getCachedCollectionById,
    findParentCollections,
    addItemToCollection,
    moveItemBetweenCollections,
    moveItems,
    switchWorkspace,
    ...realStore
  }
}

export const collectionStore = useCollectionStore()

export default useCollectionStore
