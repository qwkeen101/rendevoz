import { IBase, IMediaInstance, IWebpageInstance, MetaObject } from '../../'
import { Params, Location } from 'react-router-dom'
import { Dispatch, RefObject, SetStateAction } from 'react'
import { IFeedState } from '../../../../src/core/components/feed/hooks/useFeedState'

export interface IFeedItem extends IBase {
  id: number
  title: string
  // google news link, not real link
  link: string
  // image url
  image?: string
  content?: string
  favicon?: string
  description?: string
  date?: number
  lastRead?: number
  source?: string
  collectionId?: number
  followed?: boolean
  feedType: 'webpage' | 'podcast' | 'youtube' | 'tweet' | 'bilibili'
  enclosure?: {
    url: string
    length?: number
    type?: string
  }
  state?: {
    title?: string
    domain?: string
    author?: string
    favicon?: string
    translatedTitle?: string
    // pre parsed / already parsed content, cache it
    content?: import('slate').Descendant[]
  }
}

export type INews = { title: string; description?: string; time: number; source?: string; image?: string; favicon?: string; url: string }

export interface IFeedCollection extends IBase {
  icon?: string
  feedUrl: string
  name: string
  items: number[]
  lastFetchedAt?: number
  unreadCount?: number
  collectionType: IFeedItem['feedType']
  workspace?: number
  hidden?: boolean
  relatedGroups?: number[]
}

export interface IFeedFolder extends IBase {
  name: string
  collections: number[]
  feeds?: number[]
  workspace?: number
}

export type IFeedInstance = Partial<{
  editFeed: (id: number) => void
  importRSS: (folderId?: number) => void
  getCurrentLocation: () => Location & { params: Params }
  load: (e: { type: 'google'; news: INews }) => void
  getCurrentFeedInstance: () => IMediaInstance | IWebpageInstance | undefined
  feedOps: {
    navigate: (url: string, opts?: any) => void
    readLater: (id: number) => void
    refreshRecommendation: VoidFunction
    read: (id: number) => void
    importRssAsCollection: (
      rssUrl: string,
      folderId?: number,
      opts?: {
        image?: string
        name?: string
        hidden?: boolean
      }
    ) => Promise<IFeedCollection>
    refreshCollectionContent: (collectionId: number) => Promise<void>
    follow: (id: number, shouldToast?: boolean) => Promise<void>
    deleteCollection: (id: number) => Promise<void>
  }
  folderOps: {
    edit: (id: number) => void
    delete: (id: number) => void
    createFolder: (currentFolder?: Partial<IFeedFolder>) => Promise<IFeedFolder>
  }
  newsOps: {
    fetchStories: () => Promise<INews[]>
    fetchNews: (query: string) => Promise<INews[]>
    search: VoidFunction
    addNewsAsFeed: (g: INews, read?: boolean) => Promise<IFeedItem>
  }
}> & {
  scrollElementRef: RefObject<HTMLDivElement>
}
