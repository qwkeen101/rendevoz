import { atom, useAtom } from 'jotai'
import { FeedItem } from '@/core/feed/types'

export type IFeedState = {
  allFeedItems: number[]
  currentFocusedFeedItemId?: number
  lastFetchedDate?: Date
  modalOpen: boolean
  sidePeekOpen: boolean
  openLeftBar: boolean
  currentVisiblePage: 'home' | 'feeds'
  currentFeedUrl?: string
  currentCollectionId?: number
  currentFolderId?: number
  unreadCount?: number
  headerName?: string
  newItemCount?: number
  isSyncing?: boolean
  sidebarCollapsed: boolean
}

export const FeedStateAtom = atom<IFeedState>({
  allFeedItems: [],
  modalOpen: false,
  isSyncing: false,
  sidebarCollapsed: false,
  openLeftBar: false,
  sidePeekOpen: false,
  currentVisiblePage: 'home'
})

const useFeedState = () => useAtom(FeedStateAtom)

export default useFeedState
