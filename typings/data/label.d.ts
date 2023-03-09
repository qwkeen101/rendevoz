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
  type?: 'highlight' | 'shape' | 'thought' | 'object'
  color?: string
  page?: number
} & (
    | ({
        type: 'shape'
      } & IShapeLabel)
    | ({ type: 'thought' } & IThoughtLabel)
    | ({ type: 'highlight' } & IHighlightLabel)
    | ({ type: 'object' } & IObjectLabel)
  )
export interface IDroppableLabel {
  page?: number
  rect?: number[]
  mode?: 'icon' | 'picture'
  icon?: string
  pictrue?: string
}

export type IObjectLabel = {
  // [top,left,width,height]
  rect?: number[]
  metaObjectId: number
}
export interface IHighlightLabel {
  type: 'shape'
  selectedText?: string
  rects?: TextSelectRect[]
}
export interface IShapeLabel {
  // [top,left,width,height]
  rect: number[]
  shape: 'diamond' | 'rectangle' | 'round' | 'square' | 'triangle'
}
export interface IThoughtLabel {
  position?: 'left' | 'top' | 'right' | 'bottom'
  originFrom?: 'pdf' | 'editor' | 'meta' | 'image'
  originId?: number
  minimized?: boolean
  // [width, height]
  size?: number[]
}
