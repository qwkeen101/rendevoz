import { IMedia, IMediaAiSummary, IMediaChapter, IMediaExternalState, IMediaInternalState, IMediaLabel } from '~/typings'

export type IMediaEvent =
  | {
      type: 'getMeta'
      onSuccess: (id: number) => void
      temp?: boolean
    }
  | {
      type: 'playEpisode'
      id: number
    }
  | {
      type: 'update'
      updater: (curr: IMedia) => IMedia
    }
  | { type: 'pauseEpisode' }
  | {
      type: 'playlistChange'
      list: number[]
    }
  | {
      type: 'onNavigate'
      direction: 'prev' | 'next'
    }
  | {
      type: 'audioPlayButtonClicked'
    }
  | {
      type: 'currentTimeChanged'
      // seconds
      currentTime: number
    }
  | {
      type: 'addLabel'
      currentLabel: Partial<IMediaLabel>
    }
  | {
      type: 'deleteLabel'
      labelId: number | number[]
    }
  | {
      type: 'transcribe'
    }
  | {
      type: 'deleteChapter'
      id: number
    }
  | {
      type: 'addChapter'
      currentChapter: IMediaChapter[]
    }
  | {
      type: 'updateChapter'
      currentChapter: Partial<IMediaChapter>
    }
  | {
      type: 'labelDrag'
      labelId: number
    }
  | {
      type: 'transcribeFinished'
      vttText: Blob
    }
  | {
      type: 'subtitleUpdated'
      subtitleList?: IMedia['subtitleList']
      subtitleLang?: IMedia['subtitleLang']
      subtitleMode?: IMedia['subtitleMode']
      subtitleFollow?: IMedia['subtitleFollow']
    }
  | {
      type: 'jump'
      time: number
    }
  | {
      type: 'externalStateChange'
      state: Partial<IMediaExternalState>
    }
  | {
      type: 'aiSummarize'
      summary: IMediaAiSummary
    }
  | {
      type: 'removeSummary'
    }
  | {
      type: 'getSource'
    }
