import FeedParser from '@/core/feed/utils/parser'
import { TransformGoogleNewsLinkToRealLink } from '@/core/feed/utils/googleNewsScraper'
import { IFeedCollection } from '~/typings'

export default () => {
  // first fetch
  const fetchFeeds = async (url: string, type: IFeedCollection['collectionType'] = 'webpage') => {
    const text = await fetch(url).then(res => res.text())
    const res = await FeedParser(text, true)
    return res
  }

  return {
    fetchFeeds
  }
}
