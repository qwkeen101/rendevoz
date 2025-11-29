import { CollectionStore, MetaStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { compareStrings } from '@/utils'
import { ICollection } from '~/typings'

export type ITreeView = {
  id: number
  type: 'meta' | 'collection'
  name: string
  children: ITreeView[]
}
const sortTree = (tree: ITreeView[]): ITreeView[] => {
  // 自定义排序规则
  const comparator = (a: ITreeView, b: ITreeView): number => {
    // 按 type 排序，collection 在 meta 前
    if (a.type !== b.type) {
      return a.type === 'collection' ? -1 : 1
    }

    // 按 name 排序
    return compareStrings(a.name, b.name)
  }
  // 对树结构排序
  return tree
    .map(node => ({
      ...node,
      children: sortTree(node.children) // 递归排序 children
    }))
    .sort(comparator)
}
export default ({
  id,
  showHidden,
  nestedView,
  collections: outerCollections
}: {
  id: number[]
  showHidden: boolean
  nestedView?: boolean
  collections?: number[]
}) => {
  const metas = MetaStore.useMultiple(id)
  const collections = CollectionStore.useAll()
  const [view, setView] = useState<ITreeView[]>([])
  useEffect(() => {
    const metaIdSet = new Set(id)
    const validCollections = (
      outerCollections
        ? outerCollections.map(c => CollectionStore.getCachedCollectionById(c)).filter(Boolean)
        : collections.filter(c => {
            // if nested view, return all views
            if (nestedView) return true
            if (c.items?.some(i => metaIdSet.has(i.id))) return true
            return false
          })
    ) as ICollection[]
    const collectionIdSet = new Set(validCollections.map(i => i.id))
    const collectionIdToTreeMap = new Map<number, ITreeView>()
    const shouldSkipCollectionIds = new Set<number>()
    const shouldSkipMetaIds = new Set<number>()
    validCollections.forEach(c => {
      const currentTree: ITreeView = collectionIdToTreeMap.get(c.id) || {
        id: c.id,
        type: 'collection',
        name: c.name || '',
        // 先添加Object
        children: []
      }
      c.items
        ?.filter(i => i.type === 'meta' && metaIdSet.has(i.id) && MetaStore.isVisibleMetaObject(i.id, { showHidden }))
        .forEach(i => {
          shouldSkipMetaIds.add(i.id)
          currentTree.children.push({
            type: 'meta',
            id: i.id,
            name: MetaStore.getCachedMetaObject(i.id)?.name || '',
            children: []
          })
        })
      // 如果有父项
      if (c.parentId) {
        const parent = CollectionStore.getCachedCollectionById(c.parentId)
        // parent not exist
        if (!parent || !parent.items?.some(o => o.id === c.id)) {
          shouldSkipCollectionIds.add(c.id)
          return
        }
        if (!collectionIdSet.has(c.parentId) && nestedView) {
          shouldSkipCollectionIds.add(c.id)
          return
        }
        const parentTree =
          collectionIdToTreeMap.get(c.parentId) ||
          ({
            id: c.parentId,
            type: 'collection',
            children: [],
            name: CollectionStore.getCachedCollectionById(c.parentId)?.name || ''
          } as ITreeView)
        parentTree.children.push(currentTree)
        collectionIdToTreeMap.set(c.parentId, parentTree)
        shouldSkipCollectionIds.add(c.id)
      }
      collectionIdToTreeMap.set(c.id, currentTree)
    })
    const final: ITreeView[] = []
    collectionIdToTreeMap.forEach(tree => {
      if (shouldSkipCollectionIds.has(tree.id)) return
      if (!collectionIdSet.has(tree.id) && nestedView) return
      if (nestedView) {
        final.push(tree)
        return
      }
      if (tree.children.length === 1 && tree.children[0].type === 'collection') {
        final.push(tree.children[0])
      } else {
        final.push(tree)
      }
    })
    id.forEach(i => {
      if (shouldSkipMetaIds.has(i)) return
      const m = MetaStore.getCachedMetaObject(i)
      if (!m || m.deleted) return
      if (
        !MetaStore.isVisibleMetaObject(m, {
          showHidden
        })
      )
        return
      final.push({
        id: i,
        type: 'meta',
        name: m.name || '',
        children: []
      })
    })
    setView(sortTree(final))
  }, [collections, metas, showHidden, nestedView, outerCollections])

  return {
    view
  }
}
