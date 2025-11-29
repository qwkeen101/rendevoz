import { ObjectStore } from '@/api/stores'
import { IFeedItem } from '~/typings'
import universalFeedFetcher from '@/core/components/feed/utils/universalFeedFetcher'
import Id from '@/utils/id'

export default async (
  feedUrl: string,
  type: IFeedItem['feedType'] = 'webpage',
  folderId?: number,
  opts?: {
    name?: string
    image?: string
    hidden?: boolean
  }
) => {
  try {
    if (!feedUrl) return Promise.reject()
    let items: IFeedItem[] = []
    const res = await universalFeedFetcher(feedUrl, type)
    if (!res) return Promise.reject()
    let collectionDetails = {
      name: '',
      icon: ''
    }
    const collectionId = Id.getId()
    collectionDetails = {
      name: res.title,
      icon: res.image?.url
    }
    items = await Promise.all(
      res.items.map(i =>
        ObjectStore('feed').addOne({ ...i, collectionId, source: collectionDetails.name, favicon: collectionDetails.icon })
      )
    )

    const collection = await ObjectStore('feedCollection').addOne({
      id: collectionId,
      items: items.map(i => i.id),
      lastFetchedAt: Date.now(),
      name: opts?.name ?? collectionDetails.name,
      feedUrl: feedUrl,
      collectionType: type,
      unreadCount: items.length,
      icon: opts?.image ?? collectionDetails.icon
    })
    if (folderId) {
      const folder = await ObjectStore('feedFolder').getOneById(folderId)
      if (folder) {
        await ObjectStore('feedFolder').updateOne({ id: folderId, collections: [collection.id, ...folder.collections] })
      }
    }
    return collection
  } catch (e) {
    console.error(e)
    return Promise.reject()
  }
}
