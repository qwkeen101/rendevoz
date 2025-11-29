import { atom } from 'jotai'
import podcasts, { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { useGlobalAtom } from '@/hooks'
import { globalStore } from '@/api/stores'
import usePodcastData from '@/core/components/podcast/hooks/usePodcastData'

export type IPodcastState = {
  dashboard: {
    hot: IItunesPodcast[]
    episodes: IItunesPodcast[]
  }
  rightbarActive?: 'playlist' | 'subtitle' | 'label'
  rightbarVisible?: boolean
  isPlaying?: boolean
  isFocusing?: boolean
  focusEpisode?: number
  librarySearch: {
    tab?: 'podcast' | 'episode' | 'folder' | 'object'
    query?: string
    filter?: 'all' | 'isObject'
    sort?: 'follow' | 'update' | 'view'
    results?: {
      podcasts: number[]
      episodes: number[]
      history: number[]
    }
  }
  folderTabCache: Record<string, string>
  objectsCache: Record<string, number[]>
}
const PodcastStateAtom = atom<IPodcastState>({
  dashboard: { hot: [], episodes: [] },
  librarySearch: {
    query: ''
  },
  objectsCache: {},
  folderTabCache: {}
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
