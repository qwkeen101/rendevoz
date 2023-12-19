import { FeedItem } from '~/typings'
import Id from '@/utils/id'

const parseYoutubeFeed = (item: {
  author: string
  id: number
  link: string
  title: string
  'media:group': {
    'media:content': []
    'media:title': { $: { url: string } }[]
    'media:thumbnail': {
      $: {
        url: string
      }
    }[]
    'media:description': string[]
  }
}): FeedItem => {
  const videoId = item.link.split('watch?v=')[1]
  if (!videoId) {
    return item
  }
  return {
    id: item.id,
    title: item.title,
    link: item.link,
    image: item['media:group']['media:thumbnail'][0].$.url,
    description: item['media:group']['media:description'][0],
    feedType: 'youtube'
  }
}

export default parseYoutubeFeed
