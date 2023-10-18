import { FeedItem, IFeedCollection } from '~/typings'
import { ObjectStore } from '@/stores'

export default async (items: FeedItem[], collection: Partial<IFeedCollection>) => {
  const results = await Promise.all(items.map(i => ObjectStore('feed').addOne({ ...i })))
  return await ObjectStore('feedCollection').addOne({ ...collection, items: results.map(i => i.id) })
}
