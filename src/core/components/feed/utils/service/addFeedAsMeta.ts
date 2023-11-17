import { ObjectStore } from '@/api/stores'
import transformFeedItemIntoWebpage from '@/core/components/feed/utils/transformFeedItemIntoWebpage'

export default async (itemId: number) => {
  const feed = await ObjectStore('feed').getOneById(itemId)
  if (feed) {
    if (!feed.feedType || feed.feedType === 'webpage') {
      await transformFeedItemIntoWebpage(feed)
    }
    if (feed.feedType === 'youtube') {
      await ObjectStore('video').addOneWithMeta(
        {
          url: feed.link,
          thumbnail: feed.image
        },
        {
          currentMeta: {
            coverImgSrc: feed.image,
            name: feed.title,
            description: feed.description
          }
        }
      )
    }
    if (feed.feedType === 'podcast') {
      await ObjectStore('audio').addOneWithMeta(
        {
          url: feed.link,
          thumbnail: feed.image
        },
        {
          currentMeta: {
            coverImgSrc: feed.image,
            name: feed.title,
            description: feed.description
          }
        }
      )
    }
  }
}
