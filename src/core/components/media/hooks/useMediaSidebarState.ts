import { atom, useAtom } from 'jotai'

type IMediaSidebarState = {
  currentSubtitleLang?: string
  subtitleDisplayMode: 'list' | 'article'
  rightBarVisible: boolean
  rightBarWidth: number
  rightBarActive: 'label' | 'chapter' | 'subtitle' | 'hide' | 'attachments'
  rightBarRealtimeWidth: number
  subtitleOpen?: boolean
}
export const VideoSidebarStateAtom = atom<IMediaSidebarState>({
  rightBarActive: 'hide',
  rightBarVisible: false,
  subtitleOpen: false,
  rightBarWidth: 420,
  rightBarRealtimeWidth: 420,
  subtitleDisplayMode: 'list'
})

const useMediaSidebarState = () => useAtom(VideoSidebarStateAtom)

export default useMediaSidebarState
