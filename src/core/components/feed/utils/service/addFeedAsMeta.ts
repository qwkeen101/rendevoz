import { ObjectStore } from '@/api/stores'
import transformFeedItemIntoWebpage from '@/core/components/feed/utils/transformFeedItemIntoWebpage'

export default async (itemId: number) => {
  const feed = await ObjectStore('feed').getOneById(itemId)
  if (feed) {
    if (!feed.feedType || feed.feedType === 'webpage') {
      return await transformFeedItemIntoWebpage(feed)
    }
    if (feed.feedType === 'youtube') {
      return (
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
      ).meta
    }
    if (feed.feedType === 'podcast') {
      return (
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
      ).meta
    }
  }
}
