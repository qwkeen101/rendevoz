// TODO: Migrate all object types to IObject: PDF, PDFLABEL, NOTE, WHITEBOARD....

import { Box } from '../common'
import { IBase } from './base'

type IObject = IWebpage | IAudio

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
  from?:
    | {
        type: 'pdf'
        pdfId: number
        pages?: number[]
        rect?: Box
      }
    | {
        type: 'note'
        noteId: number
      }
}
export interface INoteBlock extends IBase {
  blockId: number
  noteId: number
  specType: 'noteBlock'
}

export interface ILocalFile extends IBase {
  specType: 'localFile'
  fileUrl: string
  fileName: string
}
