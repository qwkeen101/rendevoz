import { IBase, IMediaInstance, MetaObject } from '~/typings'
import { Location } from 'react-router'
import { Params } from 'react-router-dom'
import { RefObject } from 'react'

export type IYoutubeFolder = IBase & {
  specType: 'youtubeFolder'
  name: string
  items?: {
    type: 'playlist' | 'channel' | 'video'
    id: number
  }[]
  thumbnail?: string
}

export type IYoutubeVideo = IBase & {
  specType: 'youtubeVideo'
  name: string
  description?: string
  thumbnail: string
  viewCount?: number
  channelAppId: number
  channelTitle?: string
  followed?: boolean
  channelId: string
  playlistId?: string
  playlistAppId?: number
  playlistTitle?: string
  videoId: string
  duration?: number
  publishedAt?: string
  currentTime?: number
}

export type IYoutubeChannel = IBase & {
  specType: 'youtubeChannel'
  followed?: boolean
  channelId: string
  name: string
  description: string
  videoCount?: number
  subscriberCount?: number
  thumbnail: string
}

export type IYoutubePlaylist = IBase & {
  specType: 'youtubePlaylist'
  name: string
  description?: string
  followed?: boolean
  lastPlayedVideoId?: string
  thumbnail: string
  channelAppId: number
  channelId: string
  channelTitle?: string
  playlistId: string
  itemCount?: number
}

export type IYoutubeInstance = Partial<{
  focusVideo: (id: number) => void
  navigate: (url: string | number, opts?: any) => void
  viewHistory: (id: number, type: 'channel' | 'playlist') => void
  createFolder: (currentFolder?: IYoutubeFolder) => Promise<IYoutubeFolder>
  search: (tab?: 'all' | 'video' | 'channel' | 'playlist', channelId?: string) => void
  addChannel: (channelId: string) => Promise<IYoutubeChannel>
  initializeChannel: (channelId: string) => Promise<void>
  load: (
    id: string,
    type: 'video' | 'channel' | 'playlist',
    opts?: {
      playlistId?: string
      playlistAppId?: number
      channelAppId?: number
    }
  ) => void
  goTo: (
    id: number,
    type: 'video' | 'channel' | 'playlist' | 'folder',
    opts?: {
      history?: boolean
      folderId?: number
      replace?: boolean
    }
  ) => void
  addVideo: (
    videoId: string,
    opts?: {
      channelAppId?: number
      playlistAppId?: number
      history?: boolean
      channelHistory?: number
    }
  ) => Promise<IYoutubeVideo>
  addVideoToChannelHistory: (videoId: number, channelId: number) => Promise<void>
  addPlaylist: (playlistId: string) => Promise<IYoutubePlaylist>
  follow: (id: number, type: 'playlist' | 'channel' | 'video', toast?: boolean) => Promise<void>
  updateInfo: (id: number, type: 'playlist' | 'channel' | 'video') => Promise<void>
  addVideoAsMeta: (id: number) => Promise<MetaObject | undefined>
  getCurrentLocation: () => Location & { params: Params }
  getCurrentVideoInstance: () => IMediaInstance | undefined
}> & {
  scrollElementRef: RefObject<HTMLDivElement>
}
