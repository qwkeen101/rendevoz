// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....
import { MetaLink, MetaObject, PartialWithId } from '..'
import { IDraggableElement } from '../globalInstances/dragDrop'
import { IBase } from './base'
import { IPDFLabel as _IPdfLabel } from './label'

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
}
export interface IWebpage extends IBase {
  specType: 'webpage'
  url?: string
  title: string
  favicon?: string
  //clipped note
  noteId?: number
  readerMode?: boolean
  author?: string
  domain?: string
  image?: string
  labels?: number[]
}

export interface IMedia extends IBase {
  url: string
  // seconds
  lastPlayedTime: number
  // seconds
  totalPlayedTime: number
  chapters?: IMediaChapter[]
  // label ids
  labels?: number[]
  volume?: number
  thumbnail?: string
  subtitleMode?: 'list' | 'article'
  subtitleLang?: string
  subtitleFollow?: boolean
  subtitleList?: {
    lang: string
    url: string
  }[]
}

export interface IMediaLabel extends ILabel {
  // seconds
  imageUrl?: string
  time: number
}

export interface IVideo extends IMedia {
  specType: 'video'
  videoMode?: 'default' | 'theater'
}

export interface IAudio extends IMedia {
  specType: 'audio'
}

export interface INoteLabel extends ILabel {
  specType: 'noteLabel'
  targetBlockId: number
  name?: string
  description?: string
  selectedText?: string
}

export interface IWebpageLabel extends ILabel {
  specType: 'webpageLabel'
  highlightId?: number
  selectedText?: string
}

export interface IImage extends IBase {
  specType: 'image'
  imageUrl: string
  ocrResult?: string
  excalidrawUrl?: string
}

export type IPdfLabel = _IPdfLabel

export interface INoteBlock extends IBase {
  blockId: number
  noteId: number
  specType: 'noteBlock'
}

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
  name: string
}

export interface IAudioLabel extends IMediaLabel {
  specType: 'audioLabel'
}
export interface ILocalFile extends IBase {
  specType: 'localFile'
  fileUrl: string
  fileName: string
}

export interface ISyncedBlock extends IBase {
  specType: 'syncedBlock'
  blockChildren: import('slate').Descendant[]
  syncVersion: number
  // notes, whiteboards
  syncedMetaIds: number[]
  lastCheckTime?: number
}
