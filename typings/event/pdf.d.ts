import { Event } from '..'

interface JumpToHighlightEvent {
  area: HighlightArea
}

interface JumpToDestEvent {
  dest: string
}

interface AddThoughtEvent {
  id: number
}

interface JumpToPageEvent {
  pageIndex: number
}

export interface TextSelectRect {
  left?: number
  top?: number
  width?: number
  height?: number
  percentageLeft?: number
  percentageTop?: number
  percentageWidth?: number
  percentageHeight?: number
}

export interface TextSelectEvent {
  selectedText?: string
  pageIndex: number
  rects?: TextSelectRect[]
  isCancel: boolean
}

export interface HighlightTextEvent {
  str: string
  page: number
}

export interface PdfEventMap {
  jumpToHighlight: JumpToHighlightEvent
  jumpToDest: JumpToDestEvent
  addThought: AddThoughtEvent
  jumpToPage: JumpToPageEvent
  textSelect: TextSelectEvent
  addHighlight: VoidFunction
  cancelTextSelect: VoidFunction
  zoomIn: VoidFunction
  zoomOut: VoidFunction
  autoFit: VoidFunction
  togglePan: VoidFunction
  highlightText: HighlightTextEvent
}

export type PdfEvent = Event<PdfEventMap, keyof PdfEventMap>
