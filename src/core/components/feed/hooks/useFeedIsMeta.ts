import { MetaStore, ObjectStore } from '@/api/stores'
import { useEffect, useState } from 'react'
import { useGlobalAtomValue } from '@/hooks'
import { urlToIdMap } from '@/api/indexData/urlToId'

export default (feedItemId?: number) => {
  const item = ObjectStore('feed').useValue(feedItemId)
  const [isMeta, setIsMeta] = useState(false)
  const [metaId, setMetaId] = useState<number>()
  const urlToId = useGlobalAtomValue(urlToIdMap)
  const metaMap = MetaStore.useMetaObjectsMap()
  useEffect(() => {
    if (!item?.link) {
      setIsMeta(false)
      setMetaId(undefined)
      return
    }
    if ((item.enclosure?.url && urlToId.has(item.enclosure.url)) || urlToId.has(item.link)) {
      const objectId = item.enclosure?.url ? urlToId.get(item.enclosure.url) || urlToId.get(item.link) : urlToId.get(item.link)
      if (objectId) {
        const meta = MetaStore.getMetaObjectByObjectId(objectId)
        if (meta) {
          setIsMeta(meta.temp || meta.deleted ? false : true)
          setMetaId(meta.id)
        }
      } else {
        setMetaId(undefined)
      }
    } else {
      setMetaId(undefined)
      setIsMeta(false)
    }
  }, [item?.link, urlToId, metaMap])

  return {
    isMeta,
    metaId
  }
}
