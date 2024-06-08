import { FeedItem } from '~/typings'
import toast from 'react-hot-toast'
import { truncate } from 'lodash'
import FeedParser from '@/core/components/feed/utils/parser'

export default async (url: string, feedType: FeedItem['feedType']) => {
  try {
    const text = await fetch(url, {
      cache: 'no-cache'
    }).then(res => res.text())
    const initialRes = await FeedParser(text, {
      transformGoogle: true,
      urlFilterRule: s => {
        if (s.includes('reuters') || s.includes('wsj.com')) return false
        return true
      }
    })
    console.log(initialRes)
    if (url.includes('youtube.com')) {
      feedType = 'youtube'
    }
    if (url.includes('twitter')) {
      feedType = 'tweet'
    }
    const initialItems = initialRes.items.map(i => {
      let feedT = feedType
      if (i.link.includes('bilibili.com/video')) {
        feedT = 'bilibili'
      }
      return { ...i, feedType: feedT }
    })
    return {
      ...initialRes,
      items: initialItems
    }
  } catch (e) {
    console.error(e)
  }
}
