import { FeedItem } from '~/typings'
import toast from 'react-hot-toast'
import { truncate } from 'lodash'
import FeedParser from '@/core/components/feed/utils/parser'

export default async (url: string, feedType: FeedItem['feedType']) => {
  try {
    const text = await fetch(url).then(res => res.text())
    const initialRes = await FeedParser(text, {
      transformGoogle: true,
      urlFilterRule: s => {
        if (s.includes('reuters') || s.includes('wsj.com')) return false
        return true
      }
    })
    if (url.includes('youtube.com')) {
      feedType = 'youtube'
    }
    const initialItems = initialRes.items.map(i => ({ ...i, feedType: feedType }))
    return {
      ...initialRes,
      items: initialItems
    }
  } catch (e) {
    toast.error('Failed to parse content of ' + truncate(url, { length: 20 }))
  }
}
