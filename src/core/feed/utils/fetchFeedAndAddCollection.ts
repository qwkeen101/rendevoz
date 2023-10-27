import { toast } from 'react-hot-toast'
import FeedParser from '@/core/feed/utils/parser'
import { ObjectStore } from '@/stores'
import { FeedItem } from '~/typings'

export default async (feedUrl: string, type: FeedItem['feedType'] = 'webpage') => {
  try {
    feedUrl = await transformFeedUrl(feedUrl)
    if (!feedUrl) return
    const text = await fetch(feedUrl).then(res => res.text())
    const res = await FeedParser(text, true)
    const items = await Promise.all(
      res.items.map(async i => {
        if (!i.feedType) {
          i.feedType = type
        }
        return await ObjectStore('feed').addOne(i)
      })
    )
    console.log(items)
    await ObjectStore('feedCollection').addOne({
      items: items.map(i => i.id),
      lastFetchedAt: Date.now(),
      name: res.title,
      feedUrl: feedUrl,
      collectionType: type,
      unreadCount: items.length,
      icon: res.image?.url
    })
  } catch (e) {
    toast.error('Failed to add feed!')
  }
}

export const transformFeedUrl = async (url: string) => {
  try {
    const urlz = new URL(url)
    if (url.includes('youtube.com')) {
      // playlist sub
      if (url.includes('youtube.com/playlist')) {
        const playlistId = url.split('playlist?list=')[1]
        if (playlistId) {
          url = 'https://www.youtube.com/feeds/videos.xml?playlist_id=' + playlistId
        }
      }
      const channelId = new DOMParser()
        .parseFromString(await fetch(url).then(res => res.text()), 'text/html')
        .querySelector('meta[itemprop="identifier"]')
        ?.getAttribute('content')
      if (channelId) {
        url = 'https://www.youtube.com/feeds/videos.xml?channel_id=' + channelId
      }
    }
    return url
  } catch (e) {}
}
