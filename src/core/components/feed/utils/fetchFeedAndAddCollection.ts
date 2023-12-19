import { toast } from 'react-hot-toast'
import FeedParser from '@/core/components/feed/utils/parser'
import { ObjectStore } from '@/api/stores'
import { FeedItem } from '~/typings'
import getAllItemsInChannel from '@/core/components/feed/utils/youtube/getAllItemsInChannel'
import { getSetting } from '@/core'
import getAllItemsInPlaylist from '@/core/components/feed/utils/youtube/getAllItemsInPlaylist'

export default async (feedUrl: string, type: FeedItem['feedType'] = 'webpage') => {
  try {
    feedUrl = await transformFeedUrl(feedUrl)
    if (!feedUrl) return
    let items: FeedItem[] = []
    const text = await fetch(feedUrl).then(res => res.text())
    const res = await FeedParser(text, true)
    let collectionDetails = {
      name: '',
      icon: ''
    }
    const setting = getSetting()
    if (feedUrl.includes('https://www.youtube.com/feeds/videos.xml?channel_id=') && setting.general.youtubeApiKey) {
      const youtubeChannelId = feedUrl.replace('https://www.youtube.com/feeds/videos.xml?channel_id=', '')
      try {
        const channelDetails = await getAllItemsInChannel(youtubeChannelId, setting.general.youtubeApiKey, {
          maxItems: setting.general.youtubeMaxItems
        })
        if (channelDetails) {
          collectionDetails = {
            name: channelDetails.channelName,
            icon: channelDetails.image
          }
          items = await Promise.all((channelDetails.items || []).map(async i => await ObjectStore('feed').addOne(i)))
        }
      } catch (e) {
        toast.error('Wrong Youtube API Key!')
        return
      }
    } else if (feedUrl.includes('https://www.youtube.com/feeds/videos.xml?playlist_id=') && setting.general.youtubeApiKey) {
      const youtubePlaylistId = feedUrl.replace('https://www.youtube.com/feeds/videos.xml?playlist_id=', '')
      try {
        const channelDetails = await getAllItemsInPlaylist(youtubePlaylistId, setting.general.youtubeApiKey, {
          maxItems: setting.general.youtubeMaxItems
        })
        if (channelDetails) {
          collectionDetails = {
            name: channelDetails.playlistName,
            icon: channelDetails.image
          }
          items = await Promise.all((channelDetails.items || []).map(async i => await ObjectStore('feed').addOne(i)))
        }
      } catch (e) {
        toast.error('Wrong Youtube API Key!')
        return
      }
    } else {
      items = await Promise.all(
        res.items.map(async i => {
          if (!i.feedType) {
            i.feedType = type
          }
          return await ObjectStore('feed').addOne(i)
        })
      )
      collectionDetails = {
        name: res.title,
        icon: res.image?.url
      }
    }

    console.log(items)
    await ObjectStore('feedCollection').addOne({
      items: items.map(i => i.id),
      lastFetchedAt: Date.now(),
      name: collectionDetails.name,
      feedUrl: feedUrl,
      collectionType: type,
      unreadCount: items.length,
      icon: collectionDetails.icon
    })
  } catch (e) {
    console.error(e)
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
