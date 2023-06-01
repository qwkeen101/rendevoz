// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....

import { Box } from '../common'
import { IBase } from './base'

type IObject = IWebpage | IAudio

export interface ILabel extends IBase {
  parentObjectId: number
}
export interface IWebpage extends IBase {
  specType: 'webpage'
  url?: string
  title: string
  favicon?: string
  //clipped note
  noteId?: number
  readerMode?: boolean
}

export interface IAudio extends IBase {
  specType: 'audio'
  url?: string
}

export interface INoteLabel extends IBase {
  specType: 'noteLabel'
  noteId: number
  targetBlockId: number
}

export interface IWebpageLabel extends IBase {
  specType: 'webpageLabel'
  webpageId: number
  highlightId?: number
  selectedText?: string
}
export interface IImage extends IBase {
  specType: 'image'
  imageUrl: string
  ocrResult?: string
  excalidrawUrl?: string
}
export interface INoteBlock extends IBase {
  blockId: number
  noteId: number
  specType: 'noteBlock'
}

export interface IVideo extends IBase {
  specType: 'video'
  videoUrl: string
  // seconds
  lastPlayedTime: number
  // seconds
  totalPlayedTime: number
}
export interface IVideoLabel extends ILabel {
  // second
  videoTime: number
}
export interface ILocalFile extends IBase {
  specType: 'localFile'
  fileUrl: string
  fileName: string
}
