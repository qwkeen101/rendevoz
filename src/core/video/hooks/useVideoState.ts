import { atom, useAtom } from 'jotai'

export const VideoStateAtom = atom<{
  loop: boolean
  muted: boolean
  currentTime?: number
  totalTime?: number
  url?: string
  progressbarHovering: boolean
  paused: boolean
  volume: number
  speed: number
  fullScreen: boolean
  windowed: boolean
}>({
  muted: false,
  loop: false,
  progressbarHovering: false,
  paused: true,
  volume: 0.8,
  speed: 1,
  fullScreen: false,
  windowed: false
})

const useVideoState = () => useAtom(VideoStateAtom)

export default useVideoState
