import 'fuzzysort'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { ITextLayerInstance } from './core/layer'
import { Box, IPdfLabel, XYPosition } from '~/typings'
import { PageSize } from './core/page'
import { Virtualizer } from '@tanstack/react-virtual'
import { Atom, WritableAtom } from 'jotai/vanilla/atom'
import { PrimitiveAtom } from 'jotai'

type NavigateOps = {
  back: VoidFunction
  forward: VoidFunction
  insertHistory: (offset: number) => void
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
      ignoreDoublePage?: boolean
      canBack?: boolean
    }
  ) => void
  useHistory: () => {
    canBack: boolean
    canForward: boolean
  }
}

type ActionsOps = {
  zoomIn: VoidFunction
  zoomOut: VoidFunction
  setScale: (s: number) => void
  fitWidth: VoidFunction
  doublePage: VoidFunction
}

export type IPDFTextLayerOps = {
  clear: VoidFunction
  // index: multiple texts
  highlightText: (text: string, index?: number) => void
}
export type IPDFPageLayerOps = {
  clearCrop: VoidFunction
}
export type IPDFEvent =
  | {
      type: 'doublePage'
      value: boolean
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
  openEditLabelPopover: (labelDetails: Partial<IPdfLabel>, boundingBox: Box, direction?: 'top' | 'bottom') => void
}
export type IPDFInstance = Partial<{
  navigateOps: NavigateOps
  actionOps: ActionsOps
  labelOps: LabelOps
  on: (e: IPDFEvent) => void
  currentFocusLabelId: number
  getPdfId: () => number
  isFocused?: boolean
  virtualizer: Virtualizer<HTMLDivElement, Element>
  search: (word: string) =>
    | {
        searchText: string
        pageIndex: number
        num: number
      }[]
    | undefined
  // image path, box: relative rect
  capturePageImage: (pageIndex: number, box?: Box) => Promise<string | undefined>
  jumpToLabelInSidebar: (labelId: number) => void
  highlightText: (str: string, pageIndex: number, idx?: number) => Promise<void>
  highlightArea: (
    pageIndex: number,
    // all percentage
    rect: Box
  ) => Promise<void>
  getPageSize: () => PageSize & { pageSizeScale: number }
  getOutline: () => Promise<Awaited<ReturnType<PDFDocumentProxy['getOutline']>> | undefined>
  // return: thumbnail url, created by URL.createObjectURL
  getThumbnail?: (pageIdx: number, size?: { width?: number; height?: number }) => Promise<string | undefined>
  onLabelRendered?: (labelId: number) => void
  onThumbnailRendered?: VoidFunction
  getDocument?: () => Promise<PDFDocumentProxy>
  onTextLayerRendered?: (pageIndex: number, instance: ITextLayerInstance) => void
  insertLabel: (label: Partial<IPdfLabel>) => Promise<void>
  deleteLabel: (labelId: number) => Promise<void>
}> & {
  values: {
    texts: { page: number; str: string; id: number }[]
    document?: PDFDocumentProxy
    thumbnailDocument?: PDFDocumentProxy
    INDEX_TO_TEXT_LAYER: Record<number, IPDFTextLayerOps>
    INDEX_TO_PAGE_LAYER: Record<number, IPDFPageLayerOps>
    selectedText: Record<number, string>
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
