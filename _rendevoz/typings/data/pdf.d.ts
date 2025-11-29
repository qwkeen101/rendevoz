import { IBase, ISidebarDefaultProps } from './base'
import { IHighlightLabel, ILabelContainerProps, IThoughtLabel } from './label'
import { IChat, IFile, IPDFAiSummary, ISubChat } from '~/typings'

export interface IPdfDocument extends IFile, ILabelContainerProps, ISidebarDefaultProps {
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
  specType: 'pdf'
  aiSummary?: IPDFAiSummary
  aiChat?: ISubChat
  exam?: number
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
