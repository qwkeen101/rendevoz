import { ObjectStore } from '@/api/stores'
import Id from '@/utils/id'
import { IEpisode } from '~/typings'
import { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'

const transformToPodcastId = (str: string) => {
  const u = new URL(str)
  const path = u.pathname
  const id = path.split('/').find(i => i.startsWith('id'))
  if (id) {
    return id.replace('id', '')
  }
}
export default {
  getPodcastInfo: async (id: number, country = 'cn') => {
    const url = `https://itunes.apple.com/lookup?id=${id}&country=${country}&media=podcast&entity=podcast`
    const res = await fetch(url).then(i => i.json())
    const podcast = res?.results?.[0]
    if (podcast) {
      return podcast as IItunesPodcast
    }
  },
  fetchDescription: async (id: number) => {
    const podcast = await ObjectStore('podcast').getOneById(id)
    if (podcast && podcast.itunesURL) {
      const itunesURL = podcast.itunesURL
      fetch(itunesURL)
        .then(i => i.text())
        .then(o => {
          const page = new DOMParser().parseFromString(o, 'text/html')
          const desc = Array.from(page.querySelectorAll('meta').values()).find(i => i.name === 'description')
          if (desc) {
            const content = desc.content
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
      const data = await fetch(
        `https://itunes.apple.com/lookup?id=${podcastId}&country=${podcast.country ?? 'cn'}&media=podcast&entity=podcastEpisode&limit=1000`
      ).then(res => res.json())
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
        const added = await Promise.all(episodes.map(async e => ObjectStore('episode').addOne(e)))
        if (added.length) {
          ObjectStore('podcast').updateOne({ id, episodes: added.map(i => i.id) })
        }
      }
    }
  }
}
