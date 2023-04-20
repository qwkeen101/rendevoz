import { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'

export type IPdfViewer = Partial<{
  currentFocusLabelId: number
  getPdfInstance: () => PDFDocumentProxy
  jumpToPage: (pageIndex: number) => void
  search: (word: string) => Fuzzysort.KeyResults<{
    id: number
    str: string
    page: number
    prepared: Fuzzysort.Prepared
  }>
  zoomIn: VoidFunction
  zoomOut: VoidFunction
  autoFit: VoidFunction
  togglePan: VoidFunction
  highlightText: (str: string, pageIndex: number) => void
  jumpToDest: (dest: string | any[]) => void
  jumpToOffset: (offset: number) => void
  jumpToLabel: (labelId: number) => Promise<void>
  scrollBy: (offset: number) => void
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
  onTextLayerRendered?: (pageIndex: number, layer: {
    paint
  }) => void
}>
