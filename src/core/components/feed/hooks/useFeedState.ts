import { atom, useAtom } from 'jotai'
import { INews } from '~/index'

export type IFeedState = {
  dashboardNews: INews[]
  search?: string
  searchResults?: INews[]
}

export const FeedStateAtom = atom<IFeedState>({
  dashboardNews: []
})

const useFeedState = () => useAtom(FeedStateAtom)
useFeedState.atom = FeedStateAtom
export default useFeedState as typeof useFeedState & {
  atom: typeof FeedStateAtom
}
