import { IFeedItem } from '~/typings'
import FeedParser from '@/core/components/feed/utils/parser'

const universalFeedFetcher = async (url: string, feedType: IFeedItem['feedType']) => {
  try {
    const text = await fetch(url, {
      cache: 'no-cache'
    }).then(res => res.text())
    const initialRes = await FeedParser(text)
    const initialItems = initialRes.items.map(i => {
      return { ...i, feedType }
    })
    return {
      ...initialRes,
      items: initialItems
    }
  } catch (e) {
    console.error(e)
  }
}

export default universalFeedFetcher
