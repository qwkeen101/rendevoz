import 'fuzzysort'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { ITextLayerInstance } from './core/layer'
import { Box, IPdfLabel } from '~/typings'
import { PageSize } from './core/page'
import { Virtualizer } from '@tanstack/react-virtual'

type NavigateOps = {
  back: VoidFunction
  forward: VoidFunction
  insertHistory: (offset: number) => void
  jumpToPage: (pageIndex: number) => void
  jumpToLabel: (labelId: number) => Promise<void>
  jumpToDest: (dest: string | any[]) => Promise<void>
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
  getHistory: () => {
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
export type IPDFEvent =
  | {
      type: 'doublePage'
      value: boolean
    }
  | {
      type: 'readProgressChange'
      readProgress: number
      lastReadPage: number
    }
  | {
      type: 'scaleChange'
      value: number
    }
export type IPdfInstance = Partial<{
  navigateOps: NavigateOps
  actionOps: ActionsOps
  on: (e: IPDFEvent) => void
  currentFocusLabelId: number
  getPdfId: () => number
  isFocused?: boolean
  getTextOfPages: () => { page: number; str: string; id: number }[]
  virtualizer: Virtualizer<HTMLDivElement, Element>
  search: (word: string) =>
    | {
        searchText: string
        pageIndex: number
      }[]
    | undefined
  // image path, box: relative rect
  capturePageImage: (pageIndex: number, box?: Box) => Promise<string>
  jumpToLabelInSidebar: (labelId: number) => void
  highlightText: (str: string, pageIndex: number) => Promise<void>
  highlightArea: (
    pageIndex: number,
    // all percentage
    rect: Box
  ) => Promise<void>
  scrollBy: (offset: number) => void
  scrollToOffset: (offset: number, canBack?: boolean) => void
  getPageSize: () => PageSize & { pageSizeScale: number }
  getOutline: () => Promise<
    {
      title: string
      bold: boolean
      italic: boolean
      color: Uint8ClampedArray
      dest: string | any[] | null
      url: string | null
      unsafeUrl: string | undefined
      newWindow: boolean | undefined
      count: number | undefined
      items: any[]
    }[]
  >
  // return: thumbnail url, created by URL.createObjectURL
  getThumbnail?: (pageIdx: number) => Promise<string | undefined>
  onLabelRendered?: (labelId: number) => void
  getTextLayerInstance?: (pageIndex: number) => Promise<ITextLayerInstance>
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
  onThumbnailRendered?: VoidFunction
  getDocument?: () => Promise<PDFDocumentProxy>
  onTextLayerRendered?: (pageIndex: number, instance: ITextLayerInstance) => void
  insertLabel: (label: Partial<IPdfLabel>) => Promise<void>
  deleteLabel: (labelId: number) => Promise<void>
}>

export * from './core/annotation'
export * from './core/layout'
export * from './core/page'
export * from './core/viewer'
export * from './core/text'
export * from './core/layer'
