import { atom, useAtom } from 'jotai'

type IVideoSidebarState = {
  showChapters: boolean
  showLabels: boolean
}
export const VideoSidebarStateAtom = atom<IVideoSidebarState>({
  showChapters: false,
  showLabels: false
})

const useVideoSidebarState = () => useAtom(VideoSidebarStateAtom)

export default useVideoSidebarState
