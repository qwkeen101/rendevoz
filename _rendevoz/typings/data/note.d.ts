import { IBase } from './base'

export interface INote extends IBase {
  allBlockIds?: number[]
  subBlockIds?: number[]
  icon?: string
  color?: string
  coverImgSrc?: string
  parentNoteId?: number
  title: string
  metaId?: number
  coverPosition?: number
  contentId: number
  labels?: number[]
}

export interface NoteBlock {
  noteId: number
  parentBlockId?: number
  version: number
  subBlockIds?: number[]
}
