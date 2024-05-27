import { atom, useAtom } from 'jotai'
import { FeedItem } from '@/core/components/feed/types'
import { selectAtom } from 'jotai/utils'

export type IFeedState = {
  filteredFeedItems?: number[]
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
  alreadyReadIds: Set<number>
  readLaterIds: Set<number>
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

const alreadyReadIdsAtom = selectAtom(FeedStateAtom, s => s.alreadyReadIds)
const readLaterIdsAtom = selectAtom(FeedStateAtom, s => s.readLaterIds)
useFeedState.atom = FeedStateAtom
useFeedState.alreadyReadIdsAtom = alreadyReadIdsAtom
useFeedState.readLaterIdsAtom = readLaterIdsAtom
export default useFeedState as typeof useFeedState & {
  atom: typeof FeedStateAtom
  alreadyReadIdsAtom: typeof alreadyReadIdsAtom
  readLaterIdsAtom: typeof readLaterIdsAtom
}
