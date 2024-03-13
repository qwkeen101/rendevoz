import { IBase } from './base'
import { Box, XYPosition, TextSelectRect } from '..'

export type IPDFLabel = IBase & {
  background?: string
  color?: string
  name?: string
  page: number
  specType: 'pdfLabel'
} & (ICropLabel | IHighlightLabel)

export type ICropLabel = {
  type: 'crop'
  rect: Box
  imageUrl: string
}

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
