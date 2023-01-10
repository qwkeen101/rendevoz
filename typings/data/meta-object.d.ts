import { IBase } from './base'

// sourceType: note / metaObject / pdf document
interface MetaObject extends IBase {
  type: string
  name?: string
  description?: string
  coverImgSrc?: string
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
}
