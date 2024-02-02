import { IBase } from '../../'

export interface FeedItem extends IBase {
  id: number
  title: string
  // google news link, not real link
  link: string
  // image url
  image?: string
  content?: string
  description?: string
  date?: number
  lastRead?: number
  feedType: 'webpage' | 'podcast' | 'youtube' | 'tweet'
  enclosure?: {
    url: string
    length?: number
    type?: string
  }
  state?: {
    title?: string
    domain?: string
    author?: string
    // pre parsed / already parsed content, cache it
    content?: import('slate').Descendant[]
  }
}

export interface IFeedCollection extends IBase {
  icon?: string
  feedUrl: string
  name: string
  items: number[]
  lastFetchedAt?: number
  unreadCount?: number
  collectionType: FeedItem['feedType']
}

export interface IFeedFolder extends IBase {
  name: string
  collections: number[]
  folded?: boolean
}

export type IFeedInstance = Partial<{
  navigateOps: {
    back: VoidFunction
    forward: VoidFunction
    prepareContent: (
      feedItemId: number
    ) => void
  }
  folderOps: {
    createFolder: (currentFolder?: Partial<IFeedFolder>) => Promise<IFeedFolder>
  }
}>
