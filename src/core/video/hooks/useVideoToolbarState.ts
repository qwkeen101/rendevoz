import { atom, useAtom } from 'jotai'

export const VideoToolbarStateAtom = atom<{
  showVolume: boolean
  visible: boolean
}>({
  showVolume: false,
  visible: false
})

const useVideoToolbarState = () => useAtom(VideoToolbarStateAtom)

export default useVideoToolbarState
