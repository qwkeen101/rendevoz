import { MetaStore, ObjectStore } from '@/api/stores'
import transformFeedItemIntoWebpage from '@/core/components/feed/utils/transformFeedItemIntoWebpage'

export default async (itemId: number, metaId?: number) => {
  if (metaId) {
    const meta = MetaStore.getCachedMetaObject(metaId)
    console.log(meta)
    if (meta?.temp) {
      return await MetaStore.updateMetaObject({ id: metaId, temp: false, deleted: false })
    }
    if (meta?.deleted) {
      return await MetaStore.updateMetaObject({ id: metaId, deleted: false })
    }
    if (meta) {
      return meta
    }
  }
  const feed = await ObjectStore('feed').getOneById(itemId)
  ObjectStore('feed').updateOne({ id: itemId, viewAt: Date.now() })
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
            url: feed.enclosure?.url,
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
