import { ObjectStore } from '@/api/stores'
import Id from '@/utils/id'
import { IEpisode } from '~/typings'
import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { Queue } from 'async-await-queue'
import getPodcastCountryCode from '@/core/components/podcast/utils/getPodcastCountryCode'
import AsyncRetry from 'async-retry'

const transformToPodcastId = (str: string) => {
  const u = new URL(str)
  const path = u.pathname
  const id = path.split('/').find(i => i.startsWith('id'))
  if (id) {
    return id.replace('id', '')
  }
}
const queue = new Queue(2)
const podcastServices = {
  updateAllPodcastInfo: async () => {
    const lastFetched = localStorage.getItem('PODCAST_LAST_UPDATE')
    if (lastFetched) {
      const now = Date.now()
      const lastFetchedNum = Number(lastFetched)
      if (!Number.isNaN(lastFetchedNum)) {
        // 12 hours
        if (now - lastFetchedNum < 60 * 1000 * 12) {
          return
        }
      }
    }
    const allPodcasts = await ObjectStore('podcast').fetchAll()

    if (allPodcasts.length) {
      await Promise.all(
        allPodcasts.map(async p => {
          await queue.wait(p.id)
          try {
            const info = await podcastServices.getPodcastInfo(p.itunesId)
            if (info) {
              await ObjectStore('podcast').updateOne({
                id: p.id,
                thumbnail: info.artworkUrl600 ?? p.thumbnail,
                lastUpdated: info.releaseDate ? new Date(info.releaseDate).getTime() : p.lastUpdated
              })
            }
          } catch (e) {
            console.error(e)
          } finally {
            queue.end(p.id)
          }
        })
      )
      localStorage.setItem('PODCAST_LAST_UPDATE', `${Date.now()}`)
    }
  },
  getPodcastInfo: async (id: number | string, country = getPodcastCountryCode()) => {
    const url = `https://itunes.apple.com/lookup?id=${id}&country=${country}&media=podcast&entity=podcast`
    const res = await AsyncRetry(() => fetch(url).then(res => res.json()), {
      retries: 3
    })
    const podcast = res?.results?.[0]
    if (podcast) {
      return podcast as IItunesPodcast
    }
    return Promise.reject()
  },
  fetchDescription: async (id: number) => {
    const podcast = await ObjectStore('podcast').getOneById(id)
    if (podcast && podcast.itunesURL) {
      const itunesURL = podcast.itunesURL
      fetch(itunesURL)
        .then(i => i.text())
        .then(o => {
          const page = new DOMParser().parseFromString(o, 'text/html')
          const desc = page.head.querySelector(`#${CSS.escape('schema:show')}`)
          if (desc) {
            const content = JSON.parse(desc.innerHTML).description
            if (content) {
              ObjectStore('podcast').updateOne({ id, description: content })
            }
          }
        })
    }
  },
  fetchEpisodes: async (id: number) => {
    const podcast = await ObjectStore('podcast').getOneById(id)
    if (podcast) {
      const podcastId = transformToPodcastId(podcast.itunesURL)
      const data = await AsyncRetry(
        () =>
          fetch(
            `https://itunes.apple.com/lookup?id=${podcastId}&country=${podcast.country ?? getPodcastCountryCode()}&media=podcast&entity=podcastEpisode&limit=1000`
          ).then(res => res.json()),
        {
          retries: 3
        }
      )
      if (data) {
        const episodes = data.results
          .filter(i => i.kind === 'podcast-episode')
          .map(
            o =>
              ({
                name: o.trackName,
                enclosureURL: o.episodeUrl,
                itunesURL: o.trackViewUrl,
                originalURL: o.feedUrl,
                thumbnail: o.artworkUrl600,
                releaseDate: new Date(o.releaseDate).getTime(),
                duration: o.trackTimeMillis / 1000,
                id: Id.getId(),
                podcastId: id,
                description: o.description
              }) as IEpisode
          ) as IEpisode[]
        const currentEpisodes = await ObjectStore('episode').fetchAll()
        const currentItunesURLs = new Map(currentEpisodes.map(i => [i.itunesURL, i]))
        const added = await Promise.all(
          episodes.map(async e => {
            const existed = currentItunesURLs.get(e.itunesURL)
            return existed || (await ObjectStore('episode').addOne(e))
          })
        )
        if (added.length) {
          ObjectStore('podcast').updateOne({ id, episodes: added.map(i => i.id) })
        }
      }
    }
  }
}

export default podcastServices
