import { IMedia, IMediaChapter, IMediaExternalState, IMediaInternalState, IMediaLabel } from '~/typings'

export type IMediaEvent =
  | {
      type: 'mediaLoaded'
    }
  | {
      type: 'mediaStartPlay'
    }
  | {
      type: 'currentTimeChanged'
      // seconds
      currentTime: number
    }
  | {
      type: 'addScreenshot'
      time: number
      imageDataUrl: string
    }
  | {
      type: 'copyTimestamp'
      // number
      currentTime: number
    }
  | {
      type: 'pin'
    }
  | {
      type: 'editDetails'
    }
  | {
      type: 'assignToNewCollection'
    }
  | {
      type: 'addLabel'
      currentLabel: Partial<IMediaLabel>
    }
  | {
      type: 'deleteLabel'
      labelId: number
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
      type: 'externalStateChange'
      state: Partial<IMediaExternalState>
    }
