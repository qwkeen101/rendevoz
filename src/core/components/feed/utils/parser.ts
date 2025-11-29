import Parser from 'rss-parser'
import Id from '@/utils/id'
import { getImg } from '@/core/components/webpage/utils/previewWebUrl'
import parseYoutubeFeed from '@/core/components/feed/utils/parseYoutubeFeed'
import { IFeedItem } from '~/typings'

const parser = new Parser({
  customFields: {
    item: [
      ['media:content', 'image'],
      ['itunes:image', 'image'],
      ['media:group', 'media:group']
    ]
  }
})
const DParser = new DOMParser()
const FeedParser = async (
  str: string,
  opts?: {
    urlFilterRule?: (s: string) => boolean
  }
) => {
  const { urlFilterRule } = opts || {}
  const result = await parser.parseString(str)
  const feedItemResults = result.items
    .map(i => {
      if (!i.title || !i.link) return
      const newItem: IFeedItem = {
        title: i.title,
        link: i.link,
        id: Id.getId(),
        date: i.pubDate || i.isoDate ? new Date(i.pubDate || i.isoDate).getTime() : undefined,
        description: i.contentSnippet?.replace(/(\r\n|\n|\r)/gm, ''),
        enclosure: i.enclosure
      }
      if (newItem.link.includes('www.youtube.com/watch')) {
        Object.assign(newItem, parseYoutubeFeed(i))
      }
      if (urlFilterRule) {
        if (!urlFilterRule(newItem.link)) {
          return
        }
      }
      if (i.image) {
        if (i.image.$) {
          newItem.image = i.image.$.url || i.image.$.href
        }
      }
      if (!newItem.image) {
        if (i.content) {
          const img = DParser.parseFromString(i.content, 'text/html').querySelector('img')
          if (img) {
            if (img.src) {
              newItem.image = img.src
            }
          }
        }
      }
      return newItem
    })
    .filter(i => i) as IFeedItem[]

  const urlSet = new Set<string>()
  feedItemResults.forEach(i => {
    urlSet.add(i.link)
  })
  const finalFeedItems = feedItemResults.filter(i => {
    if (!urlSet.has(i.link)) return false
    urlSet.delete(i.link)
    return true
  })

  const finalResult = { ...result, items: finalFeedItems }
  console.log(finalResult)
  return finalResult
}

export const fetchFavicon = async (url: string) => {
  const docStr = await fetch(url).then(res => res.text())
  const doc = DParser.parseFromString(docStr, 'text/html')
  return await getImg(doc, url)
}
export default FeedParser
