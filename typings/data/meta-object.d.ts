import { IBase } from './base'

// sourceType: note / metaObject / pdf document
interface MetaObject extends IBase {
  type: string
}
interface MetaKnowledgeObject extends MetaObject {
  type: 'knowledge'
  coverImgSrc?: string
  keyword: string
  noteIds?: number[]
  commentIds?: number[]
}
interface MetaDocumentObject extends MetaObject {
  type: 'document'
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
}
