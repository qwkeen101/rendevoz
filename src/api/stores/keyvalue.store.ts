import { atom } from 'jotai'
import { useDb, useGlobalAtomValue } from '@/hooks'
import { globalStore } from '@/api/stores/index'
import { useEffect } from 'react'
import { GlobalSetting, Setting } from '@/core'
import { ICollection, MetaFilterGroup, MetaGroup, MetaObject } from '~/typings'
import { Atom } from 'jotai/vanilla'
import { selectAtom } from 'jotai/utils'
import Workspace from '@/api/common/workspace'
import SyncAPI from '@/api/sync'
import { IItunesPodcast } from '@/core/components/podcast/services/podcasts'
import { IYoutubeSearchResultItem } from '@/core/components/youtube/YoutubeServices'

export type SidebarDatabaseCache = {
  viewMode?: 'title' | 'thumbnail'
  filter?: MetaFilterGroup
  filterVisible?: boolean
  sort?: 'create' | 'view' | 'name'
  searchInput?: string
  searchVisible?: boolean
  selectedMeta?: number[]
  showHidden?: boolean
}

export type ISidebarAICustomPrompts = {}

export type IPodcastData = {
  country?: string
  dashboard?: {
    hot: IItunesPodcast[]
    episodes: IItunesPodcast[]
  }
  followedEpisodes: number[]
  followedPodcasts: number[]
  recentlyViewedPodcasts: number[]
  recentlyViewedEpisodes: number[]
  playlist: {
    current?: number
    list: number[]
  }
  // for folder and podcast
  libraryCache: Record<
    string,
    {
      sort: 'nameDsc' | 'nameAsc' | 'updateDsc' | 'updateAsc' | 'createDsc' | 'createAsc' | 'totalDsc' | 'totalAsc'
      sorted?: {
        name: string
        image?: string
        icon?: string
        updatedAt?: number
        createdAt?: number
        viewAt?: number
        id: number
        total: number
      }[]
    }
  >
  history?: {
    id: number
    date: number
  }[]
}

export type IYoutubeDashboardChannelItem = {
  key: string
  items: IYoutubeSearchResultItem[]
}

export type IYoutubeData = {
  dashboard: {
    activeTopic: string
    topicToVideos?: Record<
      string,
      {
        items: IYoutubeSearchResultItem[]
        token?: string
      }
    >
    topicToChannels: Record<string, IYoutubeDashboardChannelItem>
  }
  history?: {
    id: number
    date: number
  }[]
  followedPlaylists?: number[]
  followedChannels?: number[]
  followedVideos?: number[]
  libraryActive?: Record<string, 'folders' | 'channels' | 'videos' | 'playlists'>
}

export type INewsData = {
  language?: string
  region?: string
  dashboardActive?: string
}

export type ISidebarConfig = {
  navs?: {
    key: string
    visible?: boolean
  }[]
  widgets?: ({
    visible?: boolean
    collapsed?: boolean
    // for sub ids
    expandIds?: string[]
  } & (
    | {
        key: 'workspaces' | 'folders' | 'feeds' | 'podcasts' | 'episode playlist' | 'youtube'
      }
    | {
        key: 'objects'
        type?: string
        sort?: 'recently created' | 'recently viewed' | 'name'
        show?: number
      }
  ))[]
}

export type IFocusSettings = {
  controlbarCollapsed?: boolean
  targetTranslate?: string
  layout?: 'reader' | 'theater' | 'cinema'
  subtitleMode?: 'none' | 'both' | 'original' | 'translated'
}

export type IFeedData = {
  language?: string
  region?: string
  channel?: string
  history: {
    id: number
    date: number
  }[]
  readLater?: number[]
  followedItems: number[]
  cardView: 'magazine' | 'card' | 'title'
  libraryCache: Record<
    string,
    {
      active?: 'folder' | 'collection' | 'feed' | 'objects'
      sort?: 'nameDsc' | 'nameAsc' | 'totalDsc' | 'totalAsc' | 'unreadDsc' | 'unreadAsc'
      sorted?: {
        name: string
        image?: string
        icon?: string
        id: number
        unread: number
        total: number
      }[]
    }
  >
}

export type IChatData = {
  currentChatId?: number
  chats: number[]
}

export type ITranslateData = {}

export type IExplainData = {}

export type IHomeConfig = {
  mode: 'list' | 'gallery'
  showHidden?: boolean
  breadcrumbs?: number[]
  breadcrumbsFutureStack?: number[]
  type?: 'all' | 'pinned' | MetaObject['type']
  filter?: MetaFilterGroup
  gallerySort?: 'nameDsc' | 'nameAsc' | 'createDsc' | 'viewDsc'
  listColSize?: {
    view?: number
    create?: number
  }
  listSort?: 'viewDesc' | 'viewAsc' | 'createDesc' | 'createAsc' | 'nameDsc' | 'nameAsc'
}
export type CurrentKeyValues = {
  podcastData?: IPodcastData
  sidebarConfig: ISidebarConfig
  currentWorkspace: {
    id: number
    name: string
    createdAt: number
  }
  feedData?: IFeedData
  googleNewsData?: INewsData
  baiduAccessToken?: string
  reviewStatsView?: 'calendar' | 'chart'
  chatData?: Record<number, IChatData>
  explainData?: Record<number, IExplainData>
  translateData?: Record<number, ITranslateData>
  saveFolder?: Record<string, number | undefined>
  // for feeds, podcasts, youtube
  sidebarExpandData?: string[]
  savedFilters?: {
    id: number
    workspace: number
    filter?: MetaFilterGroup
    name?: string
  }[]
  searchQueryHistory: Record<number, string[]>
  youtubeData?: IYoutubeData
  allWorkspaces: {
    id: number
    name: string
    createdAt: number
  }[]
  userSetting: Setting
  recentlyUsedIcons: string[]
  recycleBinGroup?: MetaGroup
  focusSettings?: IFocusSettings
  // string is workspace
} & Record<`${MetaObject['type']}_${string}_group`, MetaGroup> &
  Record<`tag_${number}_${string}_group`, MetaGroup> &
  Record<`collection_${number}_group`, MetaGroup> &
  Record<`prop_${number}_group`, MetaGroup> &
  Record<`all_${number}_group`, MetaGroup> &
  Record<`sidebarDatabaseCache_${number}`, SidebarDatabaseCache> &
  Record<`home_config_${number}`, IHomeConfig | undefined>

const keyvalueAtom = atom<Map<string, any>>(new Map())
// todo: use atom family?
const keyAtomCache = new Map<string, Atom<any>>()
const createKeyvalueStore = () => {
  const keyvalueDb = useDb('keypairs')
  return {
    atom: keyvalueAtom,
    getAll: async () => {
      const map = new Map(globalStore.get(keyvalueAtom))
      await keyvalueDb.each((obj, key) => {
        map.set(key.key, obj)
      })
      globalStore.set(keyvalueAtom, map)
    },
    updateOne: async <T extends keyof CurrentKeyValues>(key: T, value: CurrentKeyValues[T], db = true) => {
      const map = new Map(globalStore.get(keyvalueAtom))
      const newValue = value
      map.set(key, newValue)
      globalStore.set(keyvalueAtom, map)
      if (db) {
        await keyvalueDb.put(newValue, key)
      }
    },
    getOne: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      return globalStore.get(keyvalueAtom).get(key)
    },
    fetchOne: async <T extends keyof CurrentKeyValues>(key: T): Promise<CurrentKeyValues[T] | undefined> => {
      return await keyvalueDb.get(key)
    },
    clearAtomData: () => {
      globalStore.set(keyvalueAtom, new Map())
    },
    deleteOne: <T extends keyof CurrentKeyValues>(key: T) => {
      return keyvalueDb.delete(key)
    },
    removeFromCache: <T extends keyof CurrentKeyValues>(key: T) => {
      const m = new Map(globalStore.get(keyvalueAtom))
      m.delete(key)
      globalStore.set(keyvalueAtom, m)
    },
    freshOne: async <T extends keyof CurrentKeyValues>(key: T) => {
      const value = await keyvalueDb.get(key)
      const map = new Map(globalStore.get(keyvalueAtom))
      const prev = map.get(key)
      map.set(key, value)
      globalStore.set(keyvalueAtom, map)
      if (key === 'currentWorkspace') {
        if (value?.id !== prev?.id) {
          Workspace.switchWorkspace(value.id)
        }
      }
      if (key === 'userSetting') {
        SyncAPI.states.settingPulled = true
        GlobalSetting.setSetting(value)
      }
    },
    useValue: <T extends keyof CurrentKeyValues>(key: T): CurrentKeyValues[T] | undefined => {
      if (!keyAtomCache.has(key)) {
        keyAtomCache.set(
          key,
          selectAtom(keyvalueAtom, s => s.get(key))
        )
      }
      const atom = keyAtomCache.get(key)!
      const v = useGlobalAtomValue(atom)
      useEffect(() => {
        if (!v) {
          keyvalueDb.get(key).then(one => {
            const newMap = new Map(globalStore.get(keyvalueAtom))
            newMap.set(key, one)
            globalStore.set(keyvalueAtom, newMap)
          })
        }
      }, [v])
      return v
    }
  }
}

const KeyvalueStore = createKeyvalueStore()
export default KeyvalueStore
