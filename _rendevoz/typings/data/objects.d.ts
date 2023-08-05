// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....
import { MetaLink, MetaObject, PartialWithId } from "..";
import { IDraggableElement } from "../globalInstances/dragDrop";
import { IBase } from "./base";
import { ILabel as _IPdfLabel } from "./label";

type IObject = IWebpage | IAudio;

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
  parentObjectId: number
  description?: string
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
  name?: string
  description?: string
}

export interface IWebpageLabel extends IBase {
  specType: 'webpageLabel'
  webpageId: number
  highlightId?: number
  name?: string
  description?: string
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

export type IVideoChapter = {
  id: number
  startTime: number
  imageUrl?: string
  endTime?: number
  name: string
}
export interface IVideo extends IBase {
  specType: 'video'
  videoUrl: string
  subtitleUrl?: string
  // seconds
  lastPlayedTime: number
  // seconds
  totalPlayedTime: number
  chapters?: IVideoChapter[]
  // label ids
  labels?: number[]
  volume?: number
}

export interface IVideoLabel extends ILabel {
  // second
  videoTime: number
  chapterId?: number
  imageUrl?: string
  name: string
}

export interface ILocalFile extends IBase {
  specType: 'localFile'
  fileUrl: string
  fileName: string
}
