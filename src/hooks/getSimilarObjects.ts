import { CollectionStore, globalStore, MetaStore, ObjectStore } from '@/api/stores'
import { MetaObject } from '~/typings'

export type ISimilarObjects = {
  collection: {
    name: string
    objects: MetaObject[]
  }[]
  tag: {
    name: string
    color: string
    objects: MetaObject[]
  }[]
  type: {
    objects: MetaObject[]
  }
  name: {
    name: string
    objects: MetaObject[]
  }[]
}
export default (metaId: number, sameType?: boolean): ISimilarObjects | undefined => {
  const currentMeta = MetaStore.getMetaObjectsMap().get(metaId)
  const map = MetaStore.getMetaObjectsMap()
  if (!currentMeta) return
  const collections = CollectionStore.buildMetaCollections(metaId)
  const collectionResult = collections
    .map(c => {
      const last = c.pop()
      if (last) {
        return {
          name: last.name,
          objects: last.items
            ?.map(i => {
              if (i.type === 'meta' && i.id) {
                const m = map.get(i.id)
                if (m) {
                  if (sameType && m.type === currentMeta.type) {
                    return m
                  } else {
                    return
                  }
                  return m
                }
              }
            })
            .filter(i => i) as MetaObject[]
        }
      }
    })
    .filter(i => i)
  const allTags = currentMeta.tags || []
  const tagIndex = MetaStore.getIndexedMetaObjects()?.tagToMetaObjectIdsMap
  const tagMap = globalStore.get(ObjectStore('tag').objectMapAtom)
  if (!tagIndex) return
  const tagResult = allTags.map(id => {
    const metas = tagIndex.get(id)
    const tagDetails = tagMap.get(id)
    if (!tagDetails) return
    if (!metas || !metas.size) {
      return
    }

    return {
      name: tagDetails.name,
      color: tagDetails.color,
      objects: Array.from(metas.values())
        .map(i => map.get(i))
        ?.map(i => {
          if (!i) return
          if (i.type === 'meta' && i.id) {
            const m = map.get(i.id)
            if (m) {
              if (sameType && m.type === currentMeta.type) {
                return m
              } else {
                return
              }
              return m
            }
          }
        })
        .filter(i => i) as MetaObject[]
    }
  })

  const typeIndex = MetaStore.getIndexedMetaObjects()?.typeToMetaObjectIdsMap
  if (!typeIndex) return
  const allTypeMetas = typeIndex.get(currentMeta.type!)
  if (!allTypeMetas) return
  const typeResult = {
    objects: Array.from(allTypeMetas.values())
      .map(id => {
        return map.get(id)
      })
      .filter(i => i)
  }
  return {
    collection: collectionResult,
    tag: tagResult,
    type: typeResult,
    name: []
  }
}
