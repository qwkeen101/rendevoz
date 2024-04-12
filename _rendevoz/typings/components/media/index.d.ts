import { PartialWithId } from '@/types'
import { IMedia, IMediaChapter, IMediaLabel, IMetaAttachment, IVideoLabel } from '../..'
import { VideoState } from '@/core/video/hooks/useVideoState'
import { Size } from '../common'
import { IMediaEvent } from '~/typings/components/media/event'
import { CSSProperties } from 'react'

export type IMediaState = {
  loaded?: boolean
  jumpTime?: number
  subtitleUrl?: string
  videoId?: number
  onlyCore?: boolean
} & Partial<IMedia> &
  IMediaInternalState &
  IMediaExternalState

export type IMediaExternalState = {
  name: string
  description?: string
  isPinned?: boolean
  // url
  thumbnail?: string
  labelType: string
  loop?: boolean
  muted?: boolean
  volume?: number
  speed?: number
  currentTime?: number
  totalTime?: number
  autoPlay?: boolean
  url: string
  collectionName?: string
  // for attachments
  metaId?: number
  layout?: {
    showAudioThumbnail?: boolean
    showDescription?: boolean
    showProgressPins?: boolean
  }
  styles?: {
    progressHeight?: number
    progressStyle?: CSSProperties
    controlBarStyle?: CSSProperties
    playerStyle?: CSSProperties
    videoBorderRadius?: number
    titleStyle?: CSSProperties
    descriptionStyle?: CSSProperties
    descriptionEllispsis?: number
  }
  toolbar?: {
    pin?: boolean
    assignToCollection?: boolean
    addLabel?: boolean
    extra?: boolean
  }
}

export type IMediaSubtitle = {
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
  translation?: string
  hideTrans?: boolean
  textPosition: string
}

export type IMediaInternalState = {
  floated?: boolean
  progressbarHovering: boolean
  sticky?: boolean
  fullScreen: boolean
  isTranscribing?: boolean
  fullScreen?: boolean
  labelPopoverVisible?: boolean
  windowed: boolean
  jumpIndicator?: 'back' | 'forward'
  volumeIndicator?: 'up' | 'down'
  mode?: 'web' | 'video' | 'baidudisk' | 'audio'
  paused: boolean
  sortedChapters?: IMediaChapter[]
  showSubtitle?: boolean
  subtitles?: IMediaSubtitle[]
  labelWithTime?: {
    time: number
    id: number
  }[]
}

export type IMediaInstance = Partial<{
  focus: VoidFunction
  actionOps: {
    autoPlay?: VoidFunction
    play: VoidFunction
    pause: VoidFunction
    fullScreen: VoidFunction
    // second
    jumpTo: (time: number) => void
    mute: VoidFunction
    unmute: VoidFunction
    loop: VoidFunction
    unloop: VoidFunction
    // return clipped file path, duration: seconds
    clip?: (duration: { start: number; end: number }) => Promise<string | undefined>
  }
  imageOps: {
    captureCurrentImage: () => Promise<string | undefined>
    captureImage: (time: number, size?: Size) => Promise<string | undefined>
  }
  transcribe?: VoidFunction
  cancelTranscribe?: VoidFunction
  // get audio for transcribing
  getAudioFile: () => Promise<Blob>
  getMediaState: () => IMediaState
  on: (event: IMediaEvent) => any
  getUrl: () => string | undefined
  getVideoId: () => number
  getMediaContainer: () => HTMLElement | undefined
  getVideoElement: () => HTMLVideoElement | undefined
  getPlayerElement: () => HTMLElement | undefined | null
  getOffscreenVideo: () => HTMLVideoElement | undefined
  getVideoState: () => VideoState
  openLabelPopover: (labelId: number) => void
  openThumbnailAtTime: (
    time: number,
    options?: {
      labelName?: string
      labelId?: number
    }
  ) => void
  closeThumbnail: VoidFunction
  insertChapter: (chapter: Partial<IMediaChapter>) => Promise<void>
  insertChapters: (chapters: IMediaChapter[]) => Promise<void>
  deleteChapter: (chapterId: number) => Promise<void>
  updateChapter: (newChapter: PartialWithId<IMediaChapter>) => Promise<void>
  insertLabel: (label: Partial<IMediaLabel>, shouldJumpBack?: boolean, skipCaptureImage?: boolean) => Promise<IMediaLabel>
  deleteLabel: (labelId: number) => Promise<void>
  getMarkerContainer: () => HTMLElement | undefined | null
}>
