import { atom, useAtom } from 'jotai'
import { IYoutubePlaylistItem, IYoutubeSearchResultItem, IYoutubeVideoItem } from '@/core/components/youtube/YoutubeServices'
import { globalStore } from '@/api/stores'

type ChannelCache = {
  videos?: IYoutubeVideoItem[]
  tab?: 'home' | 'search' | 'videos' | 'playlists' | 'follow'
  search?: {
    query: string
    videoResults?: IYoutubeSearchResultItem[]
    playlistResults?: IYoutubeSearchResultItem[]
    videoToken?: string
    playlistToken?: string
    videoHasMore?: boolean
    playlistHasMore?: boolean
    isLoadingMore: boolean
  }
  videoTab?: {
    items?: IYoutubeVideoItem[]
    token?: string
    failed?: boolean
    hasMore?: boolean
    isLoadingMore?: boolean
  }
  playlistTab?: {
    items?: IYoutubePlaylistItem[]
    token?: string
    hasMore?: boolean
    failed?: boolean
    isLoadingMore?: boolean
  }
  followTab?: {
    playlists?: number[]
    videos?: number[]
    tab?: 'videos' | 'playlists'
  }
  playlists?: (IYoutubePlaylistItem & {
    videos?: IYoutubeVideoItem[]
  })[]
}

type PlaylistCache = {
  videoTab?: {
    items?: IYoutubeVideoItem[]
    hasMore?: boolean
    token?: string
    isLoadingMore?: boolean
  }
}

type ItemWrapperCache = {
  sort: 'follow' | 'view'
  channels: number[]
  playlists: number[]
  videos: number[]
  search?: string
  active?: 'channels' | 'playlists' | 'videos' | 'objects'
}
export type IYoutubeState = {
  library?: {
    active: 'playlist' | 'channel'
    sort: 'view' | 'follow'
  }
  search?: {
    query?: string
    tab?: 'all' | 'channel' | 'video' | 'playlist'
    token?: string
    hasMore?: boolean
    isLoadingMore?: boolean
    results?: IYoutubeSearchResultItem[]
  }
  dataCache: {
    history: number[]
    channel: Record<string, ChannelCache>
    playlist: Record<string, PlaylistCache>
    itemWrapper: Record<string | number, ItemWrapperCache>
    objects: Record<string, number[]>
  }
  history?: {
    playlist?: number
    channel?: number
  }
  globalSearch?: string
  loadingVideo?: string
  currentVideo?: number
  isFocusing?: boolean
}
export const YoutubeStateAtom = atom<IYoutubeState>({
  dataCache: {
    channel: {},
    playlist: {},
    itemWrapper: {},
    history: [],
    objects: {}
  }
})

const setChannelDataState = (channelId: string, updater: (c: ChannelCache | undefined) => Partial<ChannelCache>) => {
  const current = globalStore.get(YoutubeStateAtom).dataCache.channel[channelId]
  const currentAll = globalStore.get(YoutubeStateAtom)
  globalStore.set(YoutubeStateAtom, {
    ...currentAll,
    dataCache: { ...currentAll.dataCache, channel: { ...currentAll.dataCache.channel, [channelId]: updater(current) } }
  })
}

const setPlaylistDataState = (playlistId: string, updater: (c: PlaylistCache | undefined) => Partial<PlaylistCache>) => {
  const current = globalStore.get(YoutubeStateAtom).dataCache.playlist[playlistId]
  const currentAll = globalStore.get(YoutubeStateAtom)
  globalStore.set(YoutubeStateAtom, {
    ...currentAll,
    dataCache: { ...currentAll.dataCache, playlist: { ...currentAll.dataCache.playlist, [playlistId]: updater(current) } }
  })
}

const useYoutubeState = () => useAtom(YoutubeStateAtom)

const getState = () => globalStore.get(YoutubeStateAtom)
useYoutubeState.setChannelDataState = setChannelDataState
useYoutubeState.getState = getState
useYoutubeState.setPlaylistDataState = setPlaylistDataState
export default useYoutubeState as typeof useYoutubeState & {
  setChannelDataState: typeof setChannelDataState
  getState: typeof getState
  setPlaylistDataState: typeof setPlaylistDataState
}
