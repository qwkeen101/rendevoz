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
  mode?: 'web' | 'video'
  volume: number
  speed: number
  fullScreen: boolean
  windowed: boolean
  showSubtitle?: boolean
  subtitleUrl?: string
  subtitles?: {
    alignment: string
    direction: 'vertical' | 'horizontal'
    endTime: number
    startTime: number
    id: string
    lineAlign: string
    pauseOnExit: false
    positionAlign: string
    size: number
    snapToLines: boolean
    text: string
    textPosition: string
  }[]
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
  windowed: false,
  showSubtitle: true,
  mode: 'web'
})

const useVideoState = () => useAtom(VideoStateAtom)

export default useVideoState
