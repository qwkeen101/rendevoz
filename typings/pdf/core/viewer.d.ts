import 'fuzzysort'
import { PDFDocumentProxy } from 'pdfjs-dist'
import { ITextLayerInstance } from './layer'
import { Box } from '~/typings/common'
import { PageSize } from './page'

export type IPdfViewer = Partial<{
  currentFocusLabelId: number
  jumpToPage: (pageIndex: number) => void
  search: (word: string) =>
    | {
        searchText: string
        pageIndex: number
      }[]
    | undefined
  zoomIn: VoidFunction
  zoomOut: VoidFunction
  autoFit: VoidFunction
  togglePan: VoidFunction
  highlightText: (str: string, pageIndex: number) => Promise<void>
  highlightArea: (
    pageIndex: number,
    // all percentage
    rect: Box
  ) => Promise<void>
  jumpToDest: (dest: string | any[]) => void
  jumpToOffset: (offset: number) => void
  jumpToLabel: (labelId: number) => Promise<void>
  scrollBy: (offset: number) => void
  scrollToOffset: (offset: number) => void
  getPageSize: () => PageSize
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
  onLabelRendered?: (labelId: number) => void
  getTextLayerInstance?: (pageIndex: number) => Promise<ITextLayerInstance>
  onDocumentLoaded?: (doc: PDFDocumentProxy) => void
  onThumbnailRendered?: VoidFunction
  getDocument?: () => Promise<PDFDocumentProxy>
  onTextLayerRendered?: (pageIndex: number, instance: ITextLayerInstance) => void
}>
