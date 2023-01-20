import { GlobalScope } from '@/jotai/jotaiScope'
import useDb from '@/hooks/stores/useDb'
import Id from '@/utils/id'
import { atom, useAtom, useAtomValue } from 'jotai'
import { orderBy } from 'lodash'
import { useMemo } from 'react'
import useSWR from 'swr'
import { ICollection, ICollectionItem, IPdfDocument } from '~/typings/data'
import useDocumentStore from './document.store'
import BaseStore from './base.store'
import produce from 'immer'
import useNoteStore from './note.store'
import { useMemoizedFn } from '@/hooks'

const { orderedData } = BaseStore

export const collectionsAtom = atom<Map<number, ICollection>>(new Map())

const undeletedCollectionsAtom = atom(get => orderedData(get(collectionsAtom)).filter(i => !i.deleted))

export const pinnedCollectionsAtom = atom(get => get(undeletedCollectionsAtom).filter(i => i.pinned))

const rootCollectionsAtom = atom(get =>
  orderBy(
    get(undeletedCollectionsAtom).filter(i => i.parentId === 0),
    'updatedAt',
    'desc'
  )
)
const useCollectionStore = () => {
  const [collections, setCollections] = useAtom(collectionsAtom, GlobalScope)
  const database = useDb('collections')
  const { fetchItemsByIds, getDocumentById, all: documents } = useDocumentStore()
  const { getNoteById, all: notes } = useNoteStore()
  const { add, get, update, remove } = BaseStore

  const all = useAtomValue(undeletedCollectionsAtom, GlobalScope)

  const rootCollections = useAtomValue(rootCollectionsAtom, GlobalScope)

  const getChildrenCollections = (rootId?: number) => {
    return orderBy(
      all.filter(i => i.parentId === (rootId || 0)),
      'updatedAt',
      'desc'
    )
  }
  const getChildrenDocuments = (rootId?: number) => {
    const collection = get(rootId, collections)
    return collection?.documents?.map(i => getDocumentById(i)).filter(i => !!i)
  }
  const getChildrenItems = (collectionId: number) => {
    return getCollectionById(collectionId).then(collection => {
      const items = collection.items
      const promises: Promise<any>[] = []
      items?.forEach(i => {
        if (i.id) {
          if (i.type === 'document') {
            promises.push(Promise.resolve(getDocumentById(i.id)))
          }
          if (i.type === 'note') {
            promises.push(getNoteById(i.id))
          }
        }
      })
      return Promise.all(promises)
    })
  }
  const one = (id: number) => {
    return collections.get(id)
  }
  const fetchChildrenCollectionsAndDocuments = async (
    rootId: number
  ): Promise<{ documents?: IPdfDocument[]; collections?: ICollection[] }> => {
    const rootCollection = get(rootId, collections)
    if (rootCollection) {
      const childrenDocuments = await fetchItemsByIds(rootCollection.documents)
      const childrenCollections = orderBy(
        all.filter(i => i.parentId === rootId),
        'updatedAt',
        'desc'
      )
      return {
        documents: childrenDocuments,
        collections: childrenCollections
      }
    }
    return {}
  }

  const fetchCollections = async () => {
    try {
      const allCollections = await database.toArray()
      setCollections(new Map(allCollections.map(i => [i.id, i])))
    } catch (err) {
      console.error(err)
    }
  }
  const addDocumentToCollection = async (documentId: number, collectionId: number) => {
    const collection = get(collectionId, collections) || (await database.get(collectionId))
    collection?.documents.push(documentId)
    collection.updatedAt = Date.now()
    setCollections(add(collection, collections))
    database.put(collection, collectionId)
  }

  const addItemToCollection = useMemoizedFn((item: ICollectionItem, collectionId: number) => {
    return getCollectionById(collectionId).then(
      collection => {
        const newCollection = produce(collection, draft => {
          draft.items = draft.items || []
          draft.items.push(item)
        })
        setCollections(update(newCollection, collections))
        database.put(newCollection)
      },
      reject => {
        console.error("Can't add item to collection,error: ", reject)
      }
    )
  })
  const moveItemBetweenCollections = async (item: ICollectionItem, sourceCollectionId: number, targetCollectionId: number) => {
    const sourceIsRoot = sourceCollectionId === 1
    const targetIsRoot = targetCollectionId === 1
    if (sourceCollectionId === targetCollectionId) return
    if (sourceIsRoot) {
      updateCollection({
        id: item.id,
        parentId: targetCollectionId
      })
      const targetCollection = await getCollectionById(targetCollectionId)
      const newTarget = produce(targetCollection, draft => {
        draft.items = draft.items || []
        !draft.items.some(i => i.id === item.id) && draft.items.push(item)
      })
      setCollections(update(newTarget, collections))
      database.put(newTarget)
    } else {
      console.log(sourceCollectionId, item, targetCollectionId)
      const sourceCollection = await getCollectionById(sourceCollectionId)
      const newSource = produce(sourceCollection, draft => {
        draft.items = draft.items || []
        draft.items = draft.items.filter(i => i.id !== item.id)
      })
      if (targetIsRoot) {
        if (item.type === 'collection') {
          console.log(item)
          const movingCollection = await getCollectionById(item.id)
          const newMovingCollection = produce(movingCollection, draft => {
            draft.parentId = 0
          })
          setCollections(update(newSource, update(newMovingCollection, collections)))
          database.bulkPut([newSource, newMovingCollection])
          return
        }
      }

      const targetCollection = await getCollectionById(targetCollectionId)
      const newTarget = produce(targetCollection, draft => {
        draft.items = draft.items || []
        !draft.items.some(i => i.id === item.id) && draft.items.push(item)
      })

      setCollections(update(newSource, update(newTarget, collections)))
      database.bulkPut([newSource, newTarget])
    }
  }
  const getCollectionById = (collectionId: number): Promise<ICollection> => {
    const collection = get(collectionId, collections)
    if (collection) return Promise.resolve(collection)
    return new Promise((resolve, reject) => {
      database.get(collectionId).then(c => {
        if (c) {
          resolve(c)
          setCollections(add(c, collections))
        } else {
          reject("Collection don't exist!")
        }
      })
    })
  }
  const findParentCollections = (collection: ICollection) => {
    let innerCollection = collection
    const parentCollectionsList = [collection]
    while (innerCollection?.parentId !== 0) {
      const parent = collections.get(innerCollection.parentId)
      if (parent && innerCollection !== parent) {
        innerCollection = parent
        parentCollectionsList.unshift(parent)
      } else {
        throw new Error('no parent collection found!')
      }
    }
    return parentCollectionsList
  }
  const findSubCollections = (collection: ICollection) => {
    const subCollectionsList = []
    const find = (collection: ICollection, list: any[]) => {
      all
        .filter(i => i.parentId === collection.id)
        .map(i => {
          if (list) {
            list.push(i)
            find(i, list)
          }
        })
    }
    find(collection, subCollectionsList)
    return subCollectionsList
  }
  const addCollection = (collection: ICollection) => {
    const c: ICollection = {
      ...collection,
      id: collection?.id || Id.getId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      items: [],
      parentId: collection?.parentId || 0
    }
    database.put(c)
    setCollections(add(c, collections))
    return c
  }
  const renameCollection = (collectionId: number, newName: string) => {
    const targetCollection = get(collectionId, collections)
    if (targetCollection) {
      const newCollection = { ...targetCollection, name: newName }
      setCollections(update(newCollection, collections))
      database.put(newCollection)
    }
  }
  const updateCollection = (newCollection: Partial<ICollection>) => {
    if (!newCollection.id) return
    const originCollection = get(newCollection.id, collections)
    const updatedCollection = {
      ...originCollection,
      ...newCollection
    }
    setCollections(update(updatedCollection, collections))
    database.put(updatedCollection)
  }
  const updateCollections = (...newCollections: ICollection[]) => {
    // keep updated value
    let originCollections = collections
    newCollections.forEach(c => {
      const originCollection = get(c.id, originCollections)
      const updatedCollection = {
        ...originCollection,
        ...c
      }
      originCollections = update(updatedCollection, originCollections)
      database.put(updatedCollection)
    })
    setCollections(originCollections)
  }
  const deleteCollection = (collectionId: number) => {
    const collection = get(collectionId, collections)
    collection &&
      updateCollection({
        ...collection,
        deleted: true
      })
  }
  useSWR('/api/all/collections', fetchCollections)
  return useMemo(
    () => ({
      all,
      rootCollections,
      one,
      fetchChildrenCollectionsAndDocuments,
      fetchCollections,
      addDocumentToCollection,
      findParentCollections,
      addCollection,
      getChildrenCollections,
      getChildrenDocuments,
      addItemToCollection,
      getChildrenItems,
      findSubCollections,
      renameCollection,
      updateCollection,
      updateCollections,
      deleteCollection,
      moveItemBetweenCollections
    }),
    [collections, documents, notes, getNoteById]
  )
}

export default useCollectionStore
