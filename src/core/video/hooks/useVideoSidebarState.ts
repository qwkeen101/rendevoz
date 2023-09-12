import { atom, useAtom } from 'jotai'

type IVideoSidebarState = {
  showChapters: boolean
  showLabels: boolean
  showSubtitles: boolean
  currentSubtitleLang?: string
  subtitleDisplayMode: 'list' | 'article'
  rightBarWidth: number
  rightBarRealtimeWidth: number
  subtitleBarRealtimeWidth: number
  subtitleBarWidth: number
}
export const VideoSidebarStateAtom = atom<IVideoSidebarState>({
  showChapters: false,
  showLabels: false,
  showSubtitles: false,
  rightBarWidth: 420,
  subtitleBarWidth: 300,
  rightBarRealtimeWidth: 420,
  subtitleBarRealtimeWidth: 300,
  subtitleDisplayMode: 'list'
})

const useVideoSidebarState = () => useAtom(VideoSidebarStateAtom)

export default useVideoSidebarState
