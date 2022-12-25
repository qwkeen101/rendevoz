import { IBase } from './base'

export interface INote extends IBase {
  allBlockIds: number[]
  subBlockIds: number[]
  icon?: string
  coverImgSrc?: string
  parentNoteId?: number
  title: string
  metaId?: number
  coverPosition?: number
}

export interface NoteBlock {
  noteId: number
  parentBlockId?: number
  version: number
  subBlockIds?: number[]
}
