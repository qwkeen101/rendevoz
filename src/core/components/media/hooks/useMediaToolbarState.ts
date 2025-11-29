import { atom, useAtom } from 'jotai'

export const MediaToolbarStateAtom = atom<{
  currentHoverTime?: number
  currentScrubberTime?: number
  draggingScrubber?: boolean
}>({})

const useMediaToolbarState = () => useAtom(MediaToolbarStateAtom)

export default useMediaToolbarState
