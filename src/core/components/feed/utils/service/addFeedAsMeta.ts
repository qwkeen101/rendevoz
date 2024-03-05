import { ObjectStore } from '@/api/stores'
import transformFeedItemIntoWebpage from '@/core/components/feed/utils/transformFeedItemIntoWebpage'

export default async (itemId: number) => {
  const feed = await ObjectStore('feed').getOneById(itemId)
  if (feed) {
    if (!feed.feedType || feed.feedType === 'webpage') {
      return await transformFeedItemIntoWebpage(feed)
    }
    if (feed.feedType === 'youtube' || feed.feedType === 'bilibili') {
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
    if (feed.feedType === 'tweet') {
      const splitted = feed.link.split('/')
      const idx = splitted.findIndex(i => i === 'status') + 1
      const id = splitted[idx]
      if (id) {
        return (
          await ObjectStore('tweet').addOneWithMeta(
            {
              url: feed.link
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
