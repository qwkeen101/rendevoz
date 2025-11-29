import useFeedInstance from '@/core/components/feed/hooks/useFeedInstance'
import { assignProperties } from '@/utils'
import { ObjectStore } from '@/api/stores'
import useGoogleNewsState from '@/core/components/feed/news/useNewsState'
import useFeedData from '@/core/components/feed/hooks/useFeedData'
import { useNorepeatNavigate } from '@/hooks'
import useGoogleNewsData from '@/core/components/feed/news/useNewsData'
import { INews, IWebRequest } from '~/typings'
import { request } from '@/utils/request'
import channels from './FeedChannels.json'
import FeedConsts from '../FeedConsts'
import useFeedState from '../hooks/useFeedState'

export default () => {
  const instance = useFeedInstance()
  const navigate = useNorepeatNavigate()
  const [state, setState] = useFeedState()
  assignProperties(instance, {
    newsOps: {
      fetchStories: async () => {
        const data = useFeedData.getData()
        const { language = 'zh', region = 'cn', channel = 'CNN' } = data
        const siteUrl = channels.news.find(o => o.name === channel)?.url
        const url = `http://127.0.0.1:9001/news?site=${siteUrl}&lang=${language}&region=${region}`
        const res = await request<IWebRequest<INews[]>>(url)
        return res.data.result
      },
      fetchNews: async query => {
        const data = useFeedData.getData()
        const { language = 'zh', region = 'cn' } = data
        const url = `http://127.0.0.1:9001/news?search=${query}&lang=${language}&region=${region}`
        const res = await request<IWebRequest<INews[]>>(url)
        return res.data.result
      },
      addNewsAsFeed: async (g, read) => {
        try {
          const existedFeed = await ObjectStore('feed').fetchByConditions({ link: g.url })
          if (existedFeed.length === 1) {
            if (read) {
              useFeedData.addFeedToHistory(existedFeed[0].id)
            }
            return existedFeed[0]
          }
          const feed = await ObjectStore('feed').addOne({
            link: g.url,
            title: g.title,
            image: g.image,
            feedType: 'webpage',
            favicon: g.favicon,
            source: g.source,
            date: g.time ? new Date(g.time).getTime() : undefined
          })
          if (read) {
            useFeedData.addFeedToHistory(feed.id)
          }
          return feed
        } catch (e) {
          console.error(e)
          return Promise.reject()
        }
      },
      search: async () => {
        const search = state.search
        if (!search) {
          return
        }

        if (search) {
          navigate(FeedConsts.Routers.Search)
          setState(c => ({ ...c, searchResults: undefined }))
          instance.newsOps?.fetchNews(search).then(res => {
            setState(s => ({ ...s, searchResults: res }))
          })
        }
      }
    }
  })
}
