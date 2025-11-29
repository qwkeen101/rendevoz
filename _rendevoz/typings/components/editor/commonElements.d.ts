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
export interface MathElement {
  type: 'math'
  content: string
}
export interface HighlightBlockElement {
  type: 'highlight-block'
  icon?: string
  borderColor?: string
}

export interface NoteElement extends CardElement {
  type: 'note'
  noteId: number
  children: EmptyText[]
}

export interface ClozeElement {
  type: 'cloze'
  children: EmptyText[]
  id: number
  value?: string
  answer?: string
}

export interface InlineImageElement {
  type: 'inline-image'
  children: EmptyText[]
  url: string
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
export type MathBlockElement = {
  type: 'math-block'
  content?: string
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

export interface LinkElement {
  type: 'link'
  url: string
  children: Descendant[]
}

export interface ButtonElement {
  type: 'button'
  children: Descendant[]
}

export type IFrameElement = {
  type: 'iframe'
  url?: string
  width?: number
  height?: number
  children: Descendant[]
}
export interface ListItemElement {
  type: 'list-item'
  children: Descendant[]
}
export interface OrderListItemElement {
  type: 'order-list-item'
  children: Descendant[]
}
export type EmbededElement = {
  type: 'embeded'
  url?: string
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
  headerRow: boolean
  headerColumn: boolean
  columns: {
    accessor: string
    width: number
  }[]
  children: TableRowElement[]
}

export interface CodeBlockElement {
  type: 'code-block'
  content?: string
  title?: string
  language?: string
  editorBackground?: string
}
export interface SupElement {
  type: 'sup'
  children: Descendant[]
}
export interface PreElement {
  type: 'pre'
  children: Descendant[]
}
export interface TableRowElement {
  type: 'tableRow'
  children: TableCellElement[]
}
export interface TableCellElement {
  type: 'tableCell'
  colName: string
  children: Descendant[]
}

export interface TitleElement {
  type: 'title'
  children: Descendant[]
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
export interface FigCaptionElement {
  type: 'figcaption'
}
export interface ColumnListElement {
  type: 'columnList'
  children: Descendant[]
}

export interface SelectElement {
  type: 'select'
  children: EmptyText[]
  content: {
    id: number
    name: string
    answer?: boolean
    value?: boolean
  }[]
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
  | TableElement
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
  | NoteElement
  | MathBlockElement
  | ColumnElement
  | ColumnListElement
  | DividerElement
  | TableCellElement
  | TableRowElement
  | PreElement
  | SupElement
  | FigCaptionElement
  | MathElement
  | CodeBlockElement
  | HighlightBlockElement
  | IFrameElement
  | EmbededElement
  | OrderListItemElement
  | ClozeElement
  | SelectElement
  | InlineImageElement
