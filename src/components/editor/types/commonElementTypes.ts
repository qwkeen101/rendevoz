import { Descendant } from 'slate'
import { CardElement, CustomText, ElementWithId, EmptyText } from './baseTypes'

export interface HeadingElement extends ElementWithId {
  children: Descendant[]
  folded?: boolean
}

export interface HeadingOneElement extends HeadingElement {
  type: 'heading-one'
}

export interface HeadingTwoElement extends HeadingElement {
  type: 'heading-two'
}

export interface HeadingThreeElement extends HeadingElement {
  type: 'heading-three'
}

export interface HeadingFourElement extends HeadingElement {
  type: 'heading-four'
}

export interface HeadingFiveElement extends HeadingElement {
  type: 'heading-five'
}

export interface HeadingSixElement extends HeadingElement {
  type: 'heading-six'
}
export interface MediaElement {
  type: 'media'
  mediaType: 'audio' | 'video' | 'pdf'
  children: EmptyText[]
}
export interface PdfElement extends CardElement {
  type: 'pdf'
  pdfId: number
  children: EmptyText[]
}
export interface NoteElement extends CardElement{
  type: 'note'
  noteId: number
  children: EmptyText[]
}
export interface BlockQuoteElement {
  type: 'block-quote'
  align?: string
  children: Descendant[]
}

export interface ToDoElement {
  type: 'to-do'
  children: Descendant[]
  checked: boolean
}
export interface EmojiElement {
  type: 'emoji'
  name: string
  children: EmptyText[]
}

export interface DividerElement {
  type: 'divider'
  children: EmptyText[]
}
export interface BulletedListElement {
  type: 'bulleted-list'
  align?: string
  children: Descendant[]
}

export interface CheckListItemElement {
  type: 'check-list-item'
  checked: boolean
  children: Descendant[]
}

export interface EditableVoidElement {
  type: 'editable-void'
  children: EmptyText[]
}

export interface LinebreakElement {
  type: 'linebreak'
  children: EmptyText[]
}

export interface ImageElement {
  type: 'image'
  url: string
  width?: number
  align?: 'left' | 'center' | 'right'
  children: EmptyText[]
}

export interface LinkElement extends CardElement {
  type: 'link'
  url: string
  children: Descendant[]
}

export interface ButtonElement {
  type: 'button'
  children: Descendant[]
}

export interface ListItemElement {
  type: 'list-item'
  children: Descendant[]
}

export interface MentionElement {
  type: 'mention'
  character: string
  children: CustomText[]
}

export interface ParagraphElement {
  type: 'paragraph'
  align?: string
  children: Descendant[]
}

export interface TableElement {
  type: 'table'
  children: TableRow[]
}

export interface TableCellElement {
  type: 'table-cell'
  children: CustomText[]
}

export interface TableRowElement {
  type: 'table-row'
  children: TableCell[]
}

export interface TitleElement {
  type: 'title'
  children: Descendant[]
}
export interface OrderedListItemElement{

}

export interface UnorderedListItemElement{
  
}
export interface VideoElement {
  type: 'video'
  url: string
  children: EmptyText[]
}

export interface ColumnElement {
  type: 'column'
  ratio: number
  children: Descendant[]
}
export interface ColumnListElement {
  type: 'columnList'
  children: Descendant[]
}
export type CommonElement =
  | BlockQuoteElement
  | BulletedListElement
  | CheckListItemElement
  | EditableVoidElement
  | ImageElement
  | LinkElement
  | ButtonElement
  | ListItemElement
  | MentionElement
  | ParagraphElement
  | TableElement
  | TableRowElement
  | TableCellElement
  | TitleElement
  | VideoElement
  | LinebreakElement
  | HeadingOneElement
  | HeadingTwoElement
  | HeadingThreeElement
  | HeadingFourElement
  | HeadingFiveElement
  | HeadingSixElement
  | EmojiElement
  | ToDoElement
  | ParagraphElement
  | PdfElement
  | NoteElement
  | ColumnElement
  | ColumnListElement
  | DividerElement