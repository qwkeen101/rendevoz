import { atom } from 'jotai'
import podcasts, { IItunesPodcast } from '@/core/components/feed/utils/service/podcasts'
import { useGlobalAtom } from '@/hooks'
import { globalStore } from '@/api/stores'
import { IEpisode, IPodcast } from '@/core/components/feed/components/podcast/types'
import usePodcastData from '@/core/components/feed/components/podcast/usePodcastData'

export type IPodcastState = {
  dashboard: {
    hot: IItunesPodcast[]
    episodes: IItunesPodcast[]
  }
  currentPodcast?: number
  currentEpisode?: number
  inlistEpisodes?: number[]
  episodeListScrollOffset?: {
    podcastId: number
    offset: number
  }
  isPlaying?: boolean
  librarySearch: {
    tab?: 'podcast' | 'episode'
    query?: string
    filter?: 'all' | 'starred'
    sort?: 'follow' | 'update' | 'view'
    results?: {
      podcasts: number[]
      episodes: number[]
    }
  }
  currentPage: 'dashboard' | 'hot' | 'episodes' | 'podcastEpisodeList' | 'episodePlayer' | 'search'
}
const PodcastStateAtom = atom<IPodcastState>({
  dashboard: { hot: [], episodes: [] },
  currentPage: 'dashboard',
  librarySearch: {
    query: ''
  }
})

const setState = (updater: (curr: IPodcastState) => IPodcastState) => {
  const curr = globalStore.get(PodcastStateAtom)
  globalStore.set(PodcastStateAtom, updater(curr))
}
const Apis = {
  fetchHotAndEpisodes: async (opts?: { hot?: boolean; episodes?: boolean }) => {
    const [hot, episodes] = await Promise.all([
      opts?.hot !== false ? podcasts.getTop() : undefined,
      opts?.episodes !== false ? podcasts.getEpisodes() : undefined
    ])
    usePodcastData.updateData(curr => ({
      ...curr,
      dashboard: {
        hot: hot ?? curr.dashboard?.hot ?? [],
        episodes: episodes ?? curr.dashboard?.episodes ?? []
      }
    }))
  }
}
const getState = () => {
  return globalStore.get(PodcastStateAtom)
}
const usePodcastState = () => useGlobalAtom(PodcastStateAtom)
usePodcastState.apis = Apis
usePodcastState.setState = setState
usePodcastState.getState = getState
export default usePodcastState as typeof usePodcastState & {
  apis: typeof Apis
  setState: typeof setState
  getState: typeof getState
}
