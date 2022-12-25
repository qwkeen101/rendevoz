import { Noop } from '@/common/types'
import { ReactElement, RefObject } from 'react'

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
  clearTextLayer?: Noop
  onTextSelected?: (e: SelectedTextEvent) => void
  onTextSelectEnd?: Noop
}
export interface RenderPageProps {
  canvasLayer: ReactElement
  textLayer: ReactElement
  annotationLayer: ReactElement
  pageIndex: number
  pageSize: PageSize
  pageFunctionRef: RefObject<PageFunctionRef>
}
