import { ReactElement, RefObject } from 'react'
import { Box } from '~/typings/common'

export interface PageSize {
  width: number
  height: number
  scale: number
}

type SelectedTextEvent = {
  selectedText?: string
  rects?: Partial<{
    left: number
    top: number
    percentageLeft: number
    percentageTop: number
    width: number
    height: number
    percentageHeight: number
    percentageWidth: number
  }>[]
}

export interface PageFunctionRef {
  clearTextLayer?: VoidFunction
  highlightText?: (text: string) => void
  onTextSelected?: (e: SelectedTextEvent) => void
  onTextSelectEnd?: VoidFunction
  onCanvasRendered?: VoidFunction
  highlightArea?: (rect: Box) => void
  clearAllSelect?: VoidFunction
}

export interface RenderPageProps {
  canvasLayer: ReactElement
  textLayer: ReactElement
  annotationLayer: ReactElement
  pageElement: HTMLElement | null
  pageIndex: number
  pageSize: PageSize
  pageFunctionRef: RefObject<PageFunctionRef>
}
