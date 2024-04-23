import { IBase } from './base'
import { IHighlightLabel, IThoughtLabel } from './label'
import { IFile } from '~/typings'

export interface IPdfDocument extends IFile {
  name?: string
  description?: string
  metadata?: IPdfMetadata
  lastReadPage?: number
  doublePage?: boolean
  deletedAt?: number
  starred?: boolean
  color?: string
  icon?: string
  labels?: number[]
  scale?: number
  // online pdf documents
  webFileUrl?: string
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
