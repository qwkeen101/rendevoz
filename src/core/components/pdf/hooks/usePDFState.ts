import { atom, useAtom, useSetAtom } from 'jotai'
import { IPdfDocument, IPDFLabel, XYPosition } from '~/typings'
import { PdfViewerProps } from '@/core/components/pdf/PdfViewer'

type IPdfState = {
  pdfId?: number
  document?: IPdfDocument
  croppingImage?: boolean
  viewportFitScale?: number
  currentFocusedLabel?: {
    labelId?: number
    position: XYPosition
  }
  finalScale?: number
  scaleChanged?: boolean
  currentHighlightLabelId?: number
  selectMode?: boolean
  numPages?: number
  isSummarizing?: boolean
  pageToLabels: Record<number, IPDFLabel[]>
  currentFocusMessageId?: number
  currentFocusQuestionId?: number
  sidebarWidth: number
  sidebarVisible: boolean
  sidebarActive: IPdfDocument['defaultActiveSidebar']
} & Pick<PdfViewerProps, 'styles' | 'layout' | 'autoWidth' | 'state'>

export const PDFStateAtom = atom<IPdfState>({
  pageToLabels: {},
  sidebarWidth: 380,
  sidebarVisible: false,
  sidebarActive: 'ai'
})

export const useSetPDFState = () => useSetAtom(PDFStateAtom)

const usePDFState = () => useAtom(PDFStateAtom)

export default usePDFState
