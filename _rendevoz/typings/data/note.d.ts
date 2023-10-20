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
  fontSize?: number
  width?: 'default' | 'full' | 'wider'
  lineSpacing?: number
  typeface?: 'Inter' | 'Roboto' | 'Source Serif' | 'Merriweather' | 'Open Sans' | 'Muli' | 'Lato'
  // synced blocks meta ids
  syncedBlocks?: number[]
  pageWidth?: 'X-Small' | 'Small' | 'Medium' | 'Large' | 'X-Large'
  lastSavedAt?: number
}

export interface NoteBlock {
  noteId: number
  parentBlockId?: number
  version: number
  subBlockIds?: number[]
}
