import { PartialWithId } from '@/types'
import { IAISummary, ILabelContainerProps, IMedia, IMediaChapter, IMediaLabel, ISidebarDefaultProps, XYPosition } from '../..'
import { VideoState } from '@/core/video/hooks/useVideoState'
import { IMediaEvent } from '~/typings/components/media/event'
import { CSSProperties, ReactElement, RefObject } from 'react'
import { IMenuLayoutItem } from '@/components/base/menu'
import { CoreMessage } from 'ai'

export type IMediaState = {
  loaded?: boolean
  jumpTime?: number
  websiteUrl?: string
  subtitleUrl?: string
  subtitleImporterVisible?: boolean
  videoId?: number
  onlyCore?: boolean
  currentFocusMessageId?: number
  currentFocusQuestionId?: number
  columnLayout?: boolean
  sidebarWidth?: number
  sidebarActive?: 'label' | 'chapter' | 'exam' | 'summary' | 'playlist' | 'channel' | 'ai' | 'subtitles' | 'info'
  sidebarVisible?: boolean
} & Partial<IMedia> &
  IMediaInternalState &
  IMediaExternalState

export type IMediaExternalState = {
  name: string
  description?: string
  isPinned?: boolean
  paused?: boolean
  // url
  thumbnail?: string
  labelType: string
  loop?: boolean
  muted?: boolean
  volume?: number
  speed?: number
  currentTime?: number
  releaseDate?: number
  totalTime?: number
  autoPlay?: boolean
  url: string
  collectionName?: string
  // for attachments
  metaId?: number
  layout?: {
    fullSize?: boolean
    episode?: {
      sidebar?: boolean
      pageContainerRef?: RefObject<HTMLDivElement>
    }
    currentPlayingEpisode?: number
    headerLeft?: ReactElement
    headerRight?: ReactElement
    moreMenu?: IMenuLayoutItem[] | ((onClose: VoidFunction) => IMenuLayoutItem[])
    audioHeader?: boolean
    audioHeaderMode?: boolean
    audioPodcast?: boolean
    floatBarMode?: boolean
    showAudioThumbnail?: boolean
    smallAudioThumbnail?: boolean
    episodeMode?: boolean
    focusMode?:
      | boolean
      | {
          style?: CSSProperties
          onClose?: VoidFunction
        }
    showTitle?: boolean
    audioHeaderExtra?: ReactElement
  }
  styles?: {
    progressHeight?: number
    progressStyle?: CSSProperties
    controlBarStyle?: CSSProperties
    playerStyle?: CSSProperties
    playerHeaderClassName?: string
    playerHeaderNameContainerClassName?: string
    playerHeaderBottomBarClassName?: string
    videoBorderRadius?: number
    titleStyle?: CSSProperties
    descriptionStyle?: CSSProperties
    descriptionEllispsis?: number
  }
  state?: {
    isPlaying?: boolean
    followed?: boolean
    episodePlaylist?: {
      items: number[]
      current?: number
    }
    follow?: {
      followed?: boolean
      onFollow?: VoidFunction
    }
    episodeId?: number
    podcastId?: number
    ytFolderId?: number
    ytPlaylistId?: number
    ytChannelId?: number
    ytVideoId?: number
    releaseTime?: number
    podcast?: {
      name: string
      onNavigate?: VoidFunction
    }
    moreEpisodes?: {
      name: string
      id: number
      thumbnail?: string
      onNavigate: VoidFunction
    }[]
  }
  toolbar?: {
    toolbarEnabled?: boolean
    pin?: boolean
    addLabel?: boolean
    extra?: boolean
  }
} & ILabelContainerProps &
  ISidebarDefaultProps

export type IMediaSubtitle = {
  alignment?: string
  direction?: 'vertical' | 'horizontal'
  end: number
  start: number
  id?: string
  lineAlign?: string
  pauseOnExit?: false
  positionAlign?: string
  size?: number
  snapToLines?: boolean
  text: string
  translation?: string
  hideTrans?: boolean
  textPosition?: string
}

export type IMediaInternalState = {
  focus?: {
    subtitle?: 'original' | 'translated' | 'both' | 'none'
    sidebar?: 'ai' | 'label' | 'playlist'
    sidebarVisible?: boolean
    settingsVisible?: boolean
    visible?: boolean
  }
  progressbarHovering: boolean
  sticky?: boolean
  fullScreen: boolean
  isTranscribing?: boolean
  // translate lang
  isTranslating?: string
  isSummarizing?: boolean
  fullScreen?: boolean
  cinemaMode?: boolean
  labelPopoverVisible?: boolean
  windowed: boolean
  aiSummaryTab: 'summary' | 'outlines' | 'mindmap'
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

export type IMediaAiSummary = IAISummary & {
  outlines: {
    highlights: {
      description: string
      time: number
    }[]
    time: number
    title: string
    description: string
  }[]
  summary: {
    summary: string
    takeaways: {
      description: string
      time: number
    }[]
  }
}

export type IMediaInstance = Partial<{
  focus: VoidFunction
  startDragScrubber: (t: number, e: PointerEvent) => void
  actionOps: {
    autoPlay?: VoidFunction
    stopAutoPlay?: VoidFunction
    play: VoidFunction
    pause: VoidFunction
    fullScreen: VoidFunction
    // second
    jumpTo: (time: number) => void
    loop: VoidFunction
    unloop: VoidFunction
    // return clipped file path, duration: seconds
    clip?: (duration: { start: number; end: number }) => Promise<string | undefined>
  }
  imageOps: {
    captureCurrentImage: () => Promise<string | undefined>
  }
  aiOps: {
    scrollToQuestion: (id: number) => void
    getActiveChatId: (ignoreVisible?: boolean) => number | undefined
    scrollToMessage: (id: number) => void
    getInitialMessages: () => Promise<CoreMessage[]>
    summarize: () => Promise<IMediaAiSummary>
    mindmap: () => Promise<string>
    exam: () => Promise<void>
  }
  transcribe?: VoidFunction
  cancelTranscribe?: VoidFunction
  getMediaState: () => IMediaState
  setMediaState: (updater: (curr: IMediaState) => IMediaState) => void
  getSubtitle: () => Promise<IMediaSubtitle[]>
  getMediaContainer: () => HTMLElement | undefined
  getVideoElement: () => HTMLVideoElement | undefined
  getPlayerElement: () => HTMLElement | undefined | null
  getOffscreenVideo: () => HTMLVideoElement | undefined
  getFloatBarElement: () => HTMLElement | undefined
  getVideoState: () => VideoState
  openLabelEditor: (labelDetails: Partial<IMediaLabel>, position?: XYPosition) => void
  insertChapter: (chapter: Partial<IMediaChapter>) => Promise<void>
  insertChapters: (chapters: IMediaChapter[]) => Promise<void>
  deleteChapter: (chapterId: number) => Promise<void>
  updateChapter: (newChapter: PartialWithId<IMediaChapter>) => Promise<void>
  insertLabel: (
    label: Partial<IMediaLabel>,
    opts?: {
      shouldJumpBack?: boolean
      skipCaptureImage?: boolean
      popoverPosition?: XYPosition
    }
  ) => Promise<void>
  deleteLabel: (labelId: number | number[]) => Promise<void>
  getMarkerContainer: () => HTMLElement | undefined | null
}> & {
  on: (event: IMediaEvent) => any
}
