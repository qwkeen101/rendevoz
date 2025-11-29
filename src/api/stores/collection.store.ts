import { ICollection, ICollectionItem } from '~/typings/data'
import produce from 'immer'
import { CollectionStore, globalStore, MetaStore, ObjectStore } from './index'
import { useGlobalAtomValue, useSelectGlobalAtomValue } from '@/hooks'
import KeyvalueStore from '@/api/stores/keyvalue.store'
import { useMemo } from 'react'
import { PartialWithId } from '~/typings'
import { atom } from 'jotai/index'
import trans from '@/consts/trans'
import { t } from 'i18next'
import useHomeConfig from '@/scenes/home/useHomeConfig'

const childToParentAtom = atom(new Map<number, Set<number>>())
const useCollectionStore = () => {
  let dragState = undefined as
    | {
        draggingItemId: number
        draggingItemType: ICollectionItem['type']
        sourceFromId: number
      }
    | undefined

  const deleteCollection = (collectionId: number, force = false) => {
    if (force) {
      ObjectStore('collection').deleteOneById(collectionId, { force })
      const items = CollectionStore.getCachedCollectionById(collectionId)?.items
      if (items?.length) {
        items.forEach(i => {
          if (i.type === 'meta') {
            MetaStore.deleteMetaObject(i.id, { force })
          }
          if (i.type === 'collection') {
            const collectionMeta = MetaStore.getMetaObjectByObjectId(i.id)
            if (collectionMeta) {
              MetaStore.deleteMetaObject(collectionMeta.id, { force })
            }
          }
        })
      }
    } else {
      ObjectStore('collection').updateOne({ id: collectionId, deleted: true, deletedAt: Date.now() })
    }
  }

  const useParentCollection = (id: number) => {
    const parent = useSelectGlobalAtomValue(childToParentAtom, s => s.get(id))
    return parent
  }

  const recoverCollection = (id: number | number[]) => {
    const ids = Array.isArray(id) ? id : [id]
    ids.forEach(id => {
      ObjectStore('collection').updateOne({ id: id, deleted: false, deletedAt: undefined })
    })
  }
  const addCollection = async (c: Partial<ICollection>) => {
    if (c.id) {
      try {
        await CollectionStore.getCollectionById(c.id)
        return await ObjectStore('collection').updateOne({ id: c.id, ...c })
      } catch (e) {}
    }
    return (
      await ObjectStore('collection').addOneWithMeta(
        { ...c },
        {
          currentMeta: {
            name: c.name,
            type: 'collection'
          }
        }
      )
    ).one
  }
  const removeItems = async (id: number | number[], collectionId: number) => {
    const collection = CollectionStore.getCachedCollectionById(collectionId)
    if (collection) {
      const ids = new Set(Array.isArray(id) ? id : [id])
      const newCollection = produce(collection, draft => {
        draft.items = (draft.items || []).filter(i => !ids.has(i.id))
      })
      await CollectionStore.updateCollection(newCollection)
    }
  }
  const addItemToCollection = async (item: ICollectionItem | ICollectionItem[], collectionId: number) => {
    const items = Array.isArray(item) ? item : [item]
    const collection = CollectionStore.getCachedCollectionById(collectionId)
    if (collection) {
      const newCollection = produce(collection, draft => {
        const originItemsIdSet = new Set((draft.items || []).map(i => i.id))
        const validNewItems = items.filter(i => !originItemsIdSet.has(i.id))
        draft.items = [...(draft.items || []), ...validNewItems]
      })
      ObjectStore('collection').updateOne(newCollection)
    }
  }
  const getParentCollections = (id: number) => {
    const parent = globalStore.get(childToParentAtom).get(id)
    return parent ? Array.from(parent.values()) : []
  }
  const openCollection = (id: number) => {
    const parent = findParentCollections(id)
    if (parent) {
      useHomeConfig.update(c => ({ ...c, breadcrumbsFutureStack: [], breadcrumbs: parent.map(i => i.id) }))
      Global.layoutOps?.openPage('home')
    }
  }
  const moveItems = async (item: ICollectionItem | ICollectionItem[], sourceCollectionId: number, targetCollectionId: number) => {
    if (sourceCollectionId === targetCollectionId) return
    // item can not be target collection
    const items = (Array.isArray(item) ? item : [item]).filter(i => i.id !== targetCollectionId)
    const itemIds = new Set(items.map(i => i.id))
    // update each collection parent id
    items.forEach(i => {
      if (i.type === 'collection') {
        ObjectStore('collection').updateOne({ id: i.id, parentId: targetCollectionId })
      }
    })
    if (sourceCollectionId !== 0) {
      const sourceCollection = CollectionStore.getCachedCollectionById(sourceCollectionId)
      if (sourceCollection) {
        await ObjectStore('collection').updateOne(
          produce(sourceCollection, draft => {
            draft.items = (draft.items || []).filter(i => !itemIds.has(i.id))
          })
        )
      }
    }
    if (targetCollectionId !== 0) {
      await CollectionStore.addItemToCollection(items, targetCollectionId)
    }
  }

  const getCollectionById = async (collectionId: number): Promise<ICollection> => {
    const res = await ObjectStore('collection').getOneById(collectionId)
    if (!res) return Promise.reject()
    return res
  }
  const findParentCollections = (collectionId: number) => {
    const collection = CollectionStore.getCachedCollectionById(collectionId)
    if (!collection) return
    let innerCollection = collection
    const parentCollectionsList = [collection]
    while (innerCollection?.parentId !== 0) {
      const parent = CollectionStore.getCachedCollectionById(innerCollection.parentId)
      if (parent && innerCollection !== parent) {
        innerCollection = parent
        parentCollectionsList.unshift(parent)
      } else {
        break
      }
    }
    return parentCollectionsList
  }
  const useAll = (filter?: (i: ICollection) => boolean) => {
    const currentWorkspace = KeyvalueStore.useValue('currentWorkspace')
    const map = useGlobalAtomValue(ObjectStore('collection').objectMapAtom)
    return useMemo(
      () => Array.from(map.values()).filter(i => (filter ? filter(i) : true) && isVisibleCollection(i)),
      [map, currentWorkspace]
    )
  }
  const useMultiple = (ids?: Iterable<number>) => {
    const items = ObjectStore('collection').useMultiple(ids)
    return useMemo(() => items.filter(i => isVisibleCollection(i)), [items])
  }
  const getAll = () => {
    const map = globalStore.get(ObjectStore('collection').objectMapAtom)
    return Array.from(map.values()).filter(i => isVisibleCollection(i))
  }
  const buildPath = (id: number) => {
    const collection = CollectionStore.getCachedCollectionById(id)
    if (collection) {
      const parent = findParentCollections(id)
      if (parent) {
        return parent.map(i => i.name || t(trans.Unnamed)).join('/')
      }
      return ''
    }
  }
  const isVisibleCollection = (id: number | PartialWithId<ICollection>) => {
    const item = typeof id === 'number' ? CollectionStore.getCachedCollectionById(id) : id
    if (!item || !item.id) return false
    if (item.deleted) return false
    const currentWorkspace = KeyvalueStore.getOne('currentWorkspace')
    if (!(typeof item.parentId === 'number' && item.workspace === currentWorkspace?.id)) return false
    if (isInsideDeletedCollection(item.id)) return false
    const parent = findParentCollections(item.id)
    parent?.pop()
    if (parent?.some(i => !isVisibleCollection(i))) {
      return false
    }
    return true
  }
  const edit = async (id: number) => {
    const collection = await CollectionStore.getCollectionById(id)
    if (collection) {
      Global.dialogOps?.createOrEditFolder('collection', collection)
    }
  }
  const create = async (parent?: number) => {
    if (parent) {
      const collection = await CollectionStore.getCollectionById(parent)
      if (collection) {
        const c = await Global.dialogOps?.createOrEditFolder<ICollection>('collection', {
          parentId: parent,
          items: []
        })
        if (c) {
          addItemToCollection(
            {
              type: 'collection',
              id: c.id
            },
            parent
          )
        }
      }
    } else {
      Global.dialogOps?.createOrEditFolder<ICollection>('collection', {
        parentId: 0
      })
    }
  }
  const isInsideDeletedCollection = (id: number) => {
    if (CollectionStore.deletedContains.has(id)) return true
    return false
  }
  return {
    edit,
    create,
    isInsideDeletedCollection,
    useValue: ObjectStore('collection').useValue,
    getAll,
    useAll,
    getCachedCollectionById: ObjectStore('collection').getCachedOneById,
    findParentCollections,
    addItemToCollection,
    moveItems,
    deleteCollection,
    getCollectionById,
    useMultiple,
    openCollection,
    dragState,
    recoverCollection,
    addCollection,
    isVisibleCollection,
    useParentCollection,
    buildPath,
    getParentCollections,
    removeItems,
    collectionContains: new Set<number>(),
    deletedContains: new Set<number>(),
    updateCollection: ObjectStore('collection').updateOne
  }
}

export const collectionStore = useCollectionStore()

export const collectionChangeHandler = () => {
  const workspace = KeyvalueStore.getOne('currentWorkspace')?.id
  const all = Array.from(globalStore.get(ObjectStore('collection').objectMapAtom).values()).filter(i => i.workspace === workspace)
  const deletedItems = new Set<number>()
  const insideCollectionItems = new Set<number>()
  const childToParent = new Map<number, Set<number>>()
  const loopCollections = (collections: ICollection[], deleted?: boolean) => {
    collections.forEach(v => {
      const childrenCollections: ICollection[] = []
      v.items?.forEach(i => {
        const parent = childToParent.get(i.id) || new Set<number>()
        parent.add(v.id)
        if (i.type === 'collection') {
          const collectionMeta = MetaStore.getMetaObjectByObjectId(i.id, false)
          if (collectionMeta) {
            const parent = childToParent.get(collectionMeta.id) || new Set<number>()
            parent.add(v.id)
            childToParent.set(collectionMeta.id, parent)
          }
        }
        childToParent.set(i.id, parent)
        if (i.type === 'collection') {
          const c = CollectionStore.getCachedCollectionById(i.id)
          if (c) {
            childrenCollections.push(c)
          }
        }
        if (deleted || v.deleted) {
          deletedItems.add(i.id)
        }
        insideCollectionItems.add(i.id)
      })
      loopCollections(childrenCollections, deleted || v.deleted)
    })
  }
  loopCollections(all)
  globalStore.set(childToParentAtom, childToParent)
  CollectionStore.collectionContains = insideCollectionItems
  CollectionStore.deletedContains = deletedItems
}

export default useCollectionStore
