import Id from '@/utils/id'
import { atom, useAtom } from 'jotai'
import { IWebpage, MetaObject } from '~/typings'

export type WebpageState = {
  title: string
  domain: string
  author?: string
  favicon?: string
  image?: string
  url?: string
}
export type IWebpageState = {
  currentWebpage?: WebpageState
  externalState?: WebpageState & {
    content: import('slate').Descendant[]
    image?: string
    link?: string
  }
  loaded: boolean
  isLoading: boolean
  currentParsedContent?: import('slate').Descendant[]
  currentWebpageId?: number
  currentUrl?: string
  currentWebpageNoteId?: number
}

const WebpageStateAtom = atom<IWebpageState>({
  loaded: false,
  isLoading: true
})

const useWebpageState = () => useAtom(WebpageStateAtom)

export default useWebpageState
