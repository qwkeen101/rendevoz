import { ObjectStore } from '@/api/stores'
import { FeedItem, IFeedCollection } from '~/typings'

export default async (folderId: number) => {
  const folder = await ObjectStore('feedFolder').getOneById(folderId)
  if (!folder) return
  const collections = (await Promise.all(folder.collections.map(async i => await ObjectStore('feedCollection').getOneById(i)))).filter(
    i => i
  ) as IFeedCollection[]
  const items = (
    await Promise.all(
      collections.map(async i => {
        return await Promise.all(i.items.map(async o => await ObjectStore('feed').getOneById(o)))
      })
    )
  )
    .flat()
    .filter(i => i?.date) as FeedItem[]
  items.sort((b, a) => a.date - b.date)
  return items
}
