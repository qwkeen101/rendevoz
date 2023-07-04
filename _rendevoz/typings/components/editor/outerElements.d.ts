import { ElementWithId, EmptyText } from './baseTypes'

export interface IOuterElement extends ElementWithId {
  /**
   * Origin id represents the id which the outer element has in its original place
   * For example: The id highlight has in pdf note
   */
  originId: number
  children: EmptyText[]
}

export interface ThoughtElement extends IOuterElement {
  type: 'thought'
  title: string
  content: string
}

export interface BookHighlightElement extends IOuterElement {
  type: 'book-highlight'
  selectedText: string
  documentId?: number
  page?: number
  title?: string
  collapsed?: boolean
}
export interface SubPageElement extends IOuterElement {
  type: 'subPage'
  iconName?: string
}

export interface MetaObjectElement extends IOuterElement {
  type: 'metaObject'
}
export interface InlineMetaObjectElement extends IOuterElement {
  type: 'inline-metaObject'
}
export type OuterElement = ThoughtElement | BookHighlightElement | SubPageElement | MetaObjectElement | InlineMetaObjectElement
