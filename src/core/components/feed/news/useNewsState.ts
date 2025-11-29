import { atom, useAtom } from 'jotai'
import { globalStore } from '@/api/stores'
import { INews } from '@/core/components/feed/types'

type INewsState = {
  topicToNews: Record<string, INews[]>
  search?: string
  searchResults?: INews[]
  searchSavedCollectionId?: number
  recommendation?: {
    feedId: number
    collectionId: number
  }[]
  searchDataFilter?: '1h' | '1d' | '7d' | '1y' | 'any time'
}
const NewsStateAtom = atom<INewsState>({
  topicToNews: {}
})

const update = (updater: (curr: INewsState) => INewsState) => {
  const curr = globalStore.get(NewsStateAtom)
  globalStore.set(NewsStateAtom, updater(curr))
}

const useNewsState = () => useAtom(NewsStateAtom)

useNewsState.update = update
export default useNewsState as typeof useNewsState & {
  update: typeof update
}
