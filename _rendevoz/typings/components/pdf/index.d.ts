import 'fuzzysort'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { ITextLayerInstance } from './core/layer'
import { Box, IAISummary, IPdfDocument, IPDFLabel } from '~/typings'
import { PageSize } from './core/page'
import { Virtualizer } from '@tanstack/virtual-core'
import { PrimitiveAtom } from 'jotai'
import { CoreMessage } from 'ai'

export type IPDFAiSummary = IAISummary & {
  outlines: {
    highlights: {
      description: string
      pageNumber: number
      quote: string
    }[]
    pageNumber: number
    title: string
    description: string
  }[]
  summary: {
    summary: string
    takeaways: {
      description: string
      pageNumber: number
      quote: string
    }[]
    keywords: string[]
  }
}

type NavigateOps = {
  // percent: 0 - 1
  jumpToPage: (pageIndex: number, align?: 'start' | 'center', offset?: number) => void
  jumpToLabel: (labelId: number, openInSidebar?: boolean) => Promise<void>
  jumpToDest: (dest: string | any[]) => Promise<void>
  scrollBy: (y: number) => void
  // percent 0 - 1
  scrollByPercent: (percent: number) => void
  jumpToOffset: (
    offset: number,
    opts?: {
      align?: 'start' | 'center' | 'end'
    }
  ) => void
}

type ActionsOps = {
  zoomIn: VoidFunction
  zoomOut: VoidFunction
  setScale: (s: number) => void
  fitWidth: VoidFunction
  doublePage: VoidFunction
  toggleSearch: VoidFunction
}

export type SelectedTextEvent = {
  selectedText?: string
  e: PointerEvent
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

export type IPDFPageLayerOps = {
  clearCrop: VoidFunction
  highlightArea: (box: Box) => void
  clearTextSelect?: VoidFunction
  highlightText?: (text: string, index?: number, paintRed?: boolean) => void
  highlightSentence?: (index: number) => void
}

export type IPDFEvent =
  | {
      type: 'stateChange'
      state: Partial<IPdfDocument>
    }
  | {
      type: 'doublePage'
      value: boolean
    }
  | {
      type: 'removeSummary'
    }
  | {
      type: 'readProgressChange'
      lastReadPage: number
    }
  | {
      type: 'scaleChange'
      value: number
    }

type LabelOps = {
  openEditLabelPopover: (labelDetails: Partial<IPDFLabel>, boundingBox: Box, direction?: 'top' | 'bottom') => void
}
export type IPDFInstance = Partial<{
  navigateOps: NavigateOps
  actionOps: ActionsOps
  labelOps: LabelOps
  currentFocusLabelId: number
  isFocused?: boolean
  virtualizer: Virtualizer<HTMLDivElement, Element>
  aiOps: {
    scrollToQuestion: (id: number) => void
    scrollToMessage: (id: number) => void
    summarize: () => Promise<IPDFAiSummary>
    mindmap: () => Promise<string>
    exam: () => Promise<void>
    getActiveChatId: (ignoreVisible?: boolean) => number | undefined
    getInitialMessages: () => Promise<CoreMessage[]>
  }
  search: (word: string) =>
    | {
        searchText: string
        pageIndex: number
        num: number
      }[]
    | undefined
  // image data url, box: relative rect
  capturePageImage: (pageIndex: number, box?: Box) => Promise<string | undefined>
  jumpToLabelInSidebar: (labelId: number) => void
  highlightSentence: (pageIndex: number, idx: number) => Promise<void>
  highlightText: (str: string, pageIndex: number, idx?: number, paintRed?: boolean) => Promise<void>
  highlightArea: (
    pageIndex: number,
    // all percentage
    rect: Box
  ) => Promise<void>
  getContainerElement: () => HTMLElement
  getPageSize: () => PageSize & { pageSizeScale: number }
  getOutline: () => Promise<Awaited<ReturnType<PDFDocumentProxy['getOutline']>> | undefined>
  // return: thumbnail url, created by URL.createObjectURL
  getThumbnail?: (pageIdx: number, size?: { width?: number; height?: number }) => Promise<string | undefined>
  onLabelRendered?: (labelId: number) => void
  onThumbnailRendered?: VoidFunction
  onTextLayerRendered?: (pageIndex: number, instance: ITextLayerInstance) => void
  insertLabel: (label: Partial<IPDFLabel>) => Promise<void>
  deleteLabel: (labelId: number | number[]) => Promise<void>
}> & {
  on: (e: IPDFEvent) => void
  getDocument: () => Promise<PDFDocumentProxy>
  getPDF: () => IPdfDocument | undefined
  getTextContent: (pageIndex: number) => Promise<string>
  getId: () => number
  getPageFuncs: (pageIndex: number) => IPDFPageLayerOps | undefined
  values: {
    textsLoaded?: boolean
    texts: { page: number; str: string; id: number }[]
    document?: PDFDocumentProxy
    thumbnailDocument?: PDFDocumentProxy
    INDEX_TO_PAGE_LAYER: Record<number, IPDFPageLayerOps>
    selectedText: Record<number, string>
    isSelecting: boolean
    // page index -> thumbnail url map
    thumbnailAtom: PrimitiveAtom<Map<number, string>>
  }
}

export * from './core/annotation'
export * from './core/layout'
export * from './core/page'
export * from './core/viewer'
export * from './core/text'
export * from './core/layer'
