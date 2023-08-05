import { atom, useAtom } from 'jotai'

type IVideoSidebarState = {
  showChapters: boolean
  showLabels: boolean
  showSubtitles: boolean
}
export const VideoSidebarStateAtom = atom<IVideoSidebarState>({
  showChapters: false,
  showLabels: false,
  showSubtitles: false
})

const useVideoSidebarState = () => useAtom(VideoSidebarStateAtom)

export default useVideoSidebarState
