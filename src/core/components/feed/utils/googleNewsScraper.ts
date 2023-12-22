import { GoogleNewsResultItem } from '@/core/components/feed/types'
import Parser from 'rss-parser'
import FeedParser from '@/core/components/feed/utils/parser'
const DParser = new DOMParser()
const buildQueryString = (query: object) => {
  if (!query || typeof query !== 'object' || Object.keys(query).length === 0) {
    return ''
  }

  // Build and return query string
  return Object.keys(query)
    .map(key => `${key}=${query[key]}`)
    .join('&')
}

const fetchGoogleNews = async (options: {
  query: string
  timeframe?: string
  queryVars?: {
    hl?: string
    gl?: string
    ceid?: string
  }
}) => {
  const {
    query,
    timeframe = '7d',
    queryVars = {
      hl: 'en-US',
      gl: 'US',
      ceid: 'US:en'
    }
  } = options
  const queryOptions = queryVars ? buildQueryString(queryVars) : ''
  const url = `https://news.google.com/rss/search?${queryOptions}&q=${query}`
  const res = await fetch(url).then(res => res.text())
  const result = await FeedParser(res)
  const items = result.items.slice(0, 50)
  await Promise.all(
    items.map(async i => {
      try {
        i.link = await TransformGoogleNewsLinkToRealLink(i.link)
      } catch (e) {
        i.link = null
      }
    })
  )
  return {
    items: items.filter(i => i.link && !i.link.includes('reuters') && !i.link.includes('wsj.com')),
    url
  }
}

export const TransformGoogleNewsLinkToRealLink = async (googleLink: string) => {
  const res = await fetch(googleLink)
  const text = await res.text()
  const dom = DParser.parseFromString(text, 'text/html')
  const link = dom.body.querySelector('c-wiz a[rel=nofollow]')?.getAttribute('href')
  if (link) return link
}

export default fetchGoogleNews
