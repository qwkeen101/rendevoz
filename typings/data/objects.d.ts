// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....

import { IBase } from './base'

type IObject = IWebpage | IAudio

export interface IWebpage extends IBase {
  specType: 'webpage'
  url?: string
  title: string
  favicon?: string
  //clipped note
  noteId?: number
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
  highlightId: number
}
