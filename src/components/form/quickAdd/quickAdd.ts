import { CollectionStore, GroupStore, MetaStore } from '@/api/stores'
import { t } from 'i18next'
import { debounce } from 'lodash'
import toast from 'react-hot-toast'
import trans from '@/consts/trans'

const debounceToast = debounce(() => {
  toast.success(t(trans.Success.MovedSuccessfully))
}, 100)
export default async (metaId: number | number[], type: 'note' | 'group' | 'collection' | 'tag', id: number | number[]) => {
  metaId = Array.isArray(metaId) ? metaId : [metaId]
  metaId.forEach(id => {
    const m = MetaStore.getCachedMetaObject(id)
    if (m && m.temp) {
      if (!m.type.includes('Label')) {
        MetaStore.updateMetaObject({ id: m.id, temp: false })
      }
    }
  })
  if (type === 'group') {
    const ids = Array.isArray(id) ? id : [id]
    debounceToast()
    ids.forEach(i => {
      const groupMeta = MetaStore.getCachedMetaObject(i)
      if (groupMeta && groupMeta.objectId) {
        GroupStore.insertMetaIntoGroup(metaId, groupMeta.objectId)
        metaId.forEach(id => {
          MetaStore.addMetaLink({
            sourceId: id,
            targetId: groupMeta.id
          })
        })
      }
    })
  }
  if (type === 'collection') {
    if (typeof id === 'number') {
      debounceToast()
      const parentIds = new Set<number>()
      metaId.forEach(id => {
        const parent = CollectionStore.getParentCollections(id)
        parent.forEach(i => parentIds.add(i))
      })
      parentIds.forEach(parent => {
        // parent is target, return
        if (parent === id) return
        CollectionStore.removeItems(metaId, parent)
      })
      CollectionStore.addItemToCollection(
        metaId.map(id => ({
          type: 'meta',
          id: id
        })),
        id
      )
    }
  }
  if (type === 'tag') {
    const ids = Array.isArray(id) ? id : [id]
    if (metaId.length === 1) {
      const m = MetaStore.getCachedMetaObject(metaId[0])
      if (m) {
        MetaStore.updateMetaObject({ id: m.id, tags: ids })
      }
      return
    }
    debounceToast()
    metaId.forEach(mid => {
      const m = MetaStore.getCachedMetaObject(mid)
      if (m) {
        const originTags = [...(m.tags || [])]
        const newTags = [...originTags, ...ids.filter(o => !originTags.includes(o))]
        MetaStore.updateMetaObject({ id: mid, tags: newTags })
      }
    })
  }
}
