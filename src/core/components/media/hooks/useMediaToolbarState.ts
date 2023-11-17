import { atom, useAtom } from 'jotai'
import { XYPosition } from '~/typings'

export const MediaToolbarStateAtom = atom<{
  showVolume: boolean
  visible: boolean
  chooseTime?: boolean
  chosenTime?: number
  currentHoveringChapterIdx?: number
  thumbnailUrl?: string
  thumbnailVisible: boolean
  thumbnailPosition?: XYPosition
  thumbnailChapterName?: string
  thumbnailLabelName?: string
  currentHoverTime?: number
  currentHoverLabelId?: number
  currentScrubberTime?: number
  currentFocusLabelId?: number
  draggingScrubber?: boolean
}>({
  showVolume: false,
  visible: false,
  thumbnailVisible: false
})

const useMediaToolbarState = () => useAtom(MediaToolbarStateAtom)

export default useMediaToolbarState
