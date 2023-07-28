import { TextSelectRect } from '@/events/pdfEvent'
import { IBase } from './base'
import { XYPosition } from '..'

export type ILabel = IBase & {
  id?: number
  title?: string
  content?: string | any
  documentId?: number
  background?: string
  color?: string
  name?: string
  page?: number
  description?: string
} & (IShapeLabel | IThoughtLabel | IHighlightLabel | IObjectLabel | IInkLabel)

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

export interface IInkLabel {
  type: 'ink'
  // [top, left, width, height]
  rect: number[]
  points: XYPosition[]
  // [width, height]
  drawPdfSize: number[]
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
