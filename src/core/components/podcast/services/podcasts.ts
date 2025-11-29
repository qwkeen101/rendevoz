export type IItunesPodcast = {
  artistName: string
  id: string
  name: string
  kind?: 'podcast' | 'podcast-episode'
  artworkUrl100?: string
  artworkUrl600?: string
  description?: string
  trackId?: number
  trackViewUrl?: string
  trackTimeMillis?: number
  releaseDate?: string
  collectionName?: string
  collectionId?: number
  genres?: { name: string; id: string }[]
  url: string
  trackCount?: number
  trackName: string
}
export default {
  getShowNotesByItunesId: async (itunesId: number) => {
    return '1'
  },
  getTop: async (lang = 'cn', max = 100) => {
    const url = `https://rss.applemarketingtools.com/api/v2/${lang}/podcasts/top/${max}/podcasts.json`
    const res = await fetch(url).then(res => res.json())
    if (res) {
      return res.feed.results as IItunesPodcast[]
    }
    return
  },
  getEpisodes: async (lang = 'cn', max = 100) => {
    const url = `https://rss.applemarketingtools.com/api/v2/${lang}/podcasts/top/${max}/podcast-episodes.json`
    const res = await fetch(url).then(res => res.json())
    if (res) {
      return res.feed.results as IItunesPodcast[]
    }
    return
  }
}
