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
  const noteValue = [
    {
      id: Id.getId(),
      type: 'iframe',
      url: `https://www.youtube.com/embed/${videoId}`,
      children: [{ text: '' }]
    },
    ...item['media:group']['media:description'].map(i => ({
      id: Id.getId(),
      type: 'paragraph',
      children: [{ text: i }]
    }))
  ]
  return {
    id: item.id,
    title: item.title,
    link: item.link,
    image: item['media:group']['media:thumbnail'][0].$.url,
    description: item['media:group']['media:description'][0],
    state: {
      title: item.title,
      domain: 'www.youtube.com',
      author: item.author,
      content: noteValue
    }
  }
}

export default parseYoutubeFeed
