// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....
import {
  IEditorAISummary,
  ILabelContainerProps,
  IMediaAiSummary,
  IMetaProperty,
  MetaLink,
  MetaObject,
  PartialWithId,
  IDraggableElement,
  IChat,
  ISubChat,
  ISidebarDefaultProps,
  IMediaSubtitle
} from '..'
import { IBase } from './base'
import { Descendant } from 'slate'
import { Tweet } from 'react-tweet/api'
export type IRegisterdObject = {
  type: string
  allowDropOnEditor?: boolean
  normalizeDraggingEleToMetaObject?: (draggingDetails: IDraggableElement & { type: T }) => Promise<{
    normalizedMetaObject: MetaObject
    alreadyHasMeta: boolean
    shouldOpenEditMetaModal: boolean
    preLinks: PartialWithId<MetaLink>[]
  }>
  getObjectIdFromDraggingEle?: (d: IDraggableElement & { type: T }) => number | undefined
}

export interface ILabel extends IBase {
  name?: string
  parentObjectId: number
  description?: string
  imageUrl?: string
  color?: string
  selectedText?: string
  time?: number
  specType: string
  labelNote?: Descendant[]
}

export interface ITweet extends IBase {
  specType: 'tweet'
  url: string
  tweet?: Tweet
}
export interface ICode extends IBase {
  specType: 'code'
  content: string
  language?: string
}

export interface IWebpage extends IBase {
  specType: 'webpage'
  title?: string
  url?: string
  name: string
  feedCollectionId?: number
  favicon?: string
  //clipped note
  noteId?: number
  readerMode?: boolean
  author?: string
  domain?: string
  image?: string
  labels?: number[]
  showOriginal?: boolean
  aiSummary?: IEditorAISummary
  aiChat?: ISubChat
}

export interface IMedia extends IBase, ILabelContainerProps, ISidebarDefaultProps {
  url: string
  // seconds
  currentTime?: number
  chapters?: IMediaChapter[]
  // label ids
  labels?: number[]
  volume?: number
  thumbnail?: string
  aiSummary?: IMediaAiSummary
  subtitleMode?: 'list' | 'article'
  subtitleLang?: string
  subtitleFollow?: boolean
  subtitleList?: {
    lang: string
    url?: string
    value?: IMediaSubtitle[]
    code?: string
  }[]
  aiChat?: ISubChat
  exam?: number
}

export interface IMetaProp extends IBase {
  propType: IMetaProperty['propType']
  icon: string
  name: string
}

export interface IMediaLabel extends ILabel {
  // seconds
  imageUrl?: string
  time: number
  name: string
}

export interface IVideo extends IMedia {
  specType: 'video'
  ytChannelId?: number
  ytPlaylistId?: number
  ytFolderId?: number
  ytVideoId?: number
}

export interface IAudio extends IMedia {
  specType: 'audio'
  episodeId?: number
}

export interface INoteLabel extends ILabel {
  specType: 'noteLabel'
  name?: string
  description?: string
  selectedText?: string
}

export interface IWebpageLabel extends ILabel {
  specType: 'webpageLabel'
  highlightId?: number
  selectedText?: string
}

export interface IImage extends IFile {
  specType: 'image'
  url?: string
  imageUrl: string
  ocrResult?: string
}

export interface INoteBlock extends IBase {
  blockId: number
  noteId: number
  specType: 'noteBlock'
}

export type IFile = {
  url: string
  // legacy
  fileUrl?: string
} & IBase

export type IMediaChapter = {
  id: number
  startTime: number
  imageUrl?: string
  endTime?: number
  name: string
}

export interface IVideoLabel extends IMediaLabel {
  // second
  specType: 'videoLabel'
  chapterId?: number
  imageUrl?: string
}

export interface IAudioLabel extends IMediaLabel {
  specType: 'audioLabel'
}
export interface ILocalFile extends IFile {
  specType: 'localFile'
  url?: string
  name?: string
}

export type ICloudFile = IFile & {
  specType: 'cloudFile'
  url?: string
}

export interface ISyncedBlock extends IBase {
  specType: 'syncedBlock'
  blockChildren: import('slate').Descendant[]
  syncVersion: number
  // notes, whiteboards
  syncedMetaIds: number[]
  lastCheckTime?: number
}

export type IAI = {
  summary?: string
  questions?: number[]
}

export type IQuestion = IBase & {
  specType: 'question'
  // where this question is from
  parentObjectId?: number
  description?: string
  name?: string
  // related question ids
  relatedQuestions?: number[]
  explanation?: Descendant[]
  prompt?: string
} & {
  // points to some specific objects, like blocks in document or pages in pdfs or time in media
  answerType: 'pointer'
  answerPointers: ((
    | {
        pointerType: 'documentBlock'
        blockId: number
        blockStr?: string
      }
    | {
        pointerType: 'pdfPage'
        page: number
        // truncated str, maybe 100 words?
        pageStr?: string
      }
  ) & { id: number })[]
} & ( // sAnswer is AI suggested answer, answer is user provided answer
    | {
        questionType: 'text'
        sAnswer?: string
        answer?: Descendant[]
      }
    | {
        questionType: 'singleSelect'
        choices: string[]
        sAnswer?: string
        answer?: string
      }
    | {
        questionType: 'multiSelect'
        choices: string[]
        sAnswer?: string[]
        answer?: string[]
      }
    | {
        questionType: 'trueOrFalse'
        sAnswer?: boolean
        answer?: boolean
      }
    | {
        questionType: 'cloze'
        text?: Descendant[]
        answer?: Descendant[]
      }
  )
