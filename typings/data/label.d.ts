import { TextSelectRect } from '@/events/pdfEvent'
import { PdfShapes } from '@/scenes/pdf/FloatBar/Shape'
import { Rect } from '@/types'
import { IBase } from './base'
import { EditorDestination } from './note'

export type ILabel = IBase & {
  id?: number
  title?: string
  content?: string | any
  documentId?: number
  background?: string
  color?: string
  page?: number
} & (IShapeLabel | IThoughtLabel | IHighlightLabel | IObjectLabel)
export interface IDroppableLabel {
  page?: number
  rect?: number[]
  mode?: 'icon' | 'picture'
  icon?: string
  pictrue?: string
}

export type IObjectLabel = {
  type: 'object'
  // [top,left,width,height]
  rect?: number[]
  metaObjectId: number
}
export interface IHighlightLabel {
  type: 'highlight'
  specHighlightType?: 'underline'
  selectedText?: string
  rects?: TextSelectRect[]
}
export interface IShapeLabel {
  type: 'shape'
  // [top,left,width,height]
  rect: number[]
  shape: 'diamond' | 'rectangle' | 'round' | 'square' | 'triangle'
}
export interface IThoughtLabel {
  type: 'thought'
  position?: 'left' | 'top' | 'right' | 'bottom'
  originFrom?: 'pdf' | 'editor' | 'meta' | 'image'
  originId?: number
  minimized?: boolean
  // [width, height]
  size?: number[]
}
