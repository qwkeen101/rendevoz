import { MetaStore, ObjectStore } from '@/api/stores'
import { useDb } from '@/hooks'
import { FeedItem, MetaObject } from '~/typings'
import addFeedAsMeta from '@/core/components/feed/utils/service/addFeedAsMeta'

export default async (items: number[]) => {
  const objStore = useDb('objects')
  const feeds = (await Promise.all(items.map(async i => await ObjectStore('feed').fetchOneById(i)))).filter(i => i)
  const urlToFeed = new Map<string, FeedItem>(feeds.map(i => [i.feedType === 'podcast' ? i.enclosure?.url || i.link : i.link, i!]))
  const sameUrlObjs = await objStore.filter(i => urlToFeed.has(i.url)).toArray()
  const urlToObjId = new Map<string, number>(sameUrlObjs.map(i => [i.url, i.id]))
  const objIdSet = new Set(sameUrlObjs.map(i => i.id))
  const alreadyMetas = Array.from(MetaStore.getMetaObjectsMap().values()).filter(i => i.objectId && objIdSet.has(i.objectId))
  const objIdToMeta = new Map(alreadyMetas.map(i => [i.objectId, i]))
  const urlToMeta = new Map<string, MetaObject>(Array.from(urlToObjId.entries()).map(i => [i[0], objIdToMeta.get(Number(i[1]))!]))
  const metas = await Promise.all(
    feeds.map(async f => {
      if (urlToMeta.has(f.link)) {
        return urlToMeta.get(f.link)!
      } else {
        return await addFeedAsMeta(f.id)
      }
    })
  )
  return metas as MetaObject[]
}
