import { TextSelectRect } from '@/events/pdfEvent'
import { IBase } from './base'
import { EditorDestination } from './note'

export interface ILabel extends IBase {
  id?: number
  title?: string
  content?: string | any
  documentId?: number
  background?: string
  type?: string
  color?: string
  page?: number
}
export interface IDroppableLabel extends ILabel {
  page?: number
  rect?: number[]
  mode?: 'icon' | 'picture'
  icon?: string
  pictrue?: string
}

export interface IHighlightLabel extends ILabel {
  selectedText?: string
  page?: number
  rects?: TextSelectRect[]
}
export interface IThoughtLabel extends IDroppableLabel {
  position?: 'left' | 'top' | 'right' | 'bottom'
  originFrom?: 'pdf' | 'editor' | 'meta' | 'image'
  originId?: number
  minimized?: boolean
    // [width, height]
  size?: number[]
}
