import { atom, useAtom } from 'jotai'

export type WebpageState = {
  title: string
  domain: string
  author?: string
  favicon?: string
  image?: string
  url?: string
  feedCollectionId?: number
}
export type IWebpageState = {
  name: string
  url: string
  image?: string
  metaId?: number
  noteId?: number
  feedCollectionId?: number
  favicon?: string
  content?: import('slate').Descendant[]
  showOriginal?: boolean
  loaded: boolean
  isLoading: boolean
  isFailed?: boolean
}

export const WebpageStateAtom = atom<IWebpageState>({
  loaded: false,
  isLoading: false,
  name: '',
  url: ''
})

const useWebpageState = () => useAtom(WebpageStateAtom)

export default useWebpageState
