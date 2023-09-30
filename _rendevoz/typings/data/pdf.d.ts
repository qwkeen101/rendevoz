import { IBase } from './base'
import { IHighlightLabel, IThoughtLabel } from './label'

export interface IPdfDocument extends IBase {
  name?: string
  description?: string
  metadata?: IPdfMetadata
  lastReadPage?: number
  lastReadAt?: number
  totalReadTime?: number
  readProgress?: number
  totalPageNum?: number
  noteIds: number[]
  totalNoteNumber?: number
  deletedAt?: number
  starred?: boolean
  fileUrl?: string
  color?: string
  icon?: string
  labels?: number[]
  // online pdf documents
  webFileUrl?: string
  pageAnnotations?: Record<
    number,
    {
      // fetch from remote
      dataUrl?: string
      // fetch from blob db
      dataId?: number
    }
  >
}
export type CustomLabel = IHighlightLabel | IThoughtLabel
export interface PdfNoteData {
  documentId?: number
  uid?: number
  lastReadPage?: number
  lastReadTime?: Date
  totalNoteNumber?: number
  totalReadTime?: number
  labels: CustomLabel[]
}

export interface IPdfMetadata {
  title?: string
  coverBlobId?: number
  author?: string
  coverUrl?: string
}
