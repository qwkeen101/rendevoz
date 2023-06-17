import { atom, useAtom } from 'jotai'
import { IVideo, IVideoChapter } from '~/typings'

export type VideoState = {
  loop: boolean
  muted: boolean
  currentTime?: number
  totalTime?: number
  url?: string
  progressbarHovering: boolean
  paused: boolean
  jumpIndicator?: 'back' | 'forward'
  volumeIndicator?: 'up' | 'down'
  volume: number
  speed: number
  fullScreen: boolean
  windowed: boolean
  sortedChapters?: IVideoChapter[]
  videoId?: number
  floated?: boolean
  sticky?: boolean
  labelWithTime?: {
    time: number
    id: number
  }[]
} & Partial<IVideo>

export const VideoStateAtom = atom<VideoState>({
  muted: false,
  loop: false,
  progressbarHovering: false,
  paused: true,
  volume: 0.3,
  speed: 1,
  fullScreen: false,
  windowed: false
})

const useVideoState = () => useAtom(VideoStateAtom)

export default useVideoState
