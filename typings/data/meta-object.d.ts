import { IBase } from './base'

// sourceType: note / metaObject / pdf document
interface MetaObject extends IBase {
  type:
    | 'note'
    | 'pdf'
    | 'pdfLabel'
    | 'normal'
    | 'image'
    | 'whiteboard'
    | 'video'
    | 'audio'
    | 'webpage'
    | 'noteLabel'
    | 'noteBlock'
    | 'webpageLabel'
  name?: string
  description?: string
  coverImgSrc?: string
  objectId?: number
  objectUrl?: string
  tags?: number[]
  icon?: string
  color?: string
  from?: {
    icon?: string
    metaId?: number
    type?: MetaObject['type']
    name?: string
  }
  temp?: boolean
}
interface MetaWithNote {
  noteId: number
}
interface MetaKnowledgeObject extends MetaObject, MetaWithNote {
  type: 'knowledge'
  coverImgSrc?: string
  keyword: string
  noteIds?: number[]
  commentIds?: number[]
}
interface MetaDocumentObject extends MetaObject, MetaWithNote {
  type: 'document'
  title: string
  documentId: number
}
interface MetaNoteObject extends MetaObject {
  type: 'note'
  noteId: number
  title: string
}
interface MetaComment extends IBase {
  content: string
}
interface MetaLink extends IBase {
  sourceId: number
  sourceType: string
  targetId: number
  targetType: string
  label: string
  color?: string
}
