import { IWebpage } from '~/typings'
import { FeedItem } from '@/core/feed/types'

export default (webpage: IWebpage): FeedItem => {
  return {
    id: webpage.id,
    title: webpage.title,
    image: webpage.image,
    link: webpage.url
  }
}
