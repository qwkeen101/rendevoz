import { atom, useAtom } from 'jotai'
import { IPdfDocument, XYPosition } from '~/typings'
import { PdfViewerProps } from '@/core/components/pdf/PdfViewer'

type IPdfState = {
  pdfId?: number
  document?: IPdfDocument
  handDrag?: boolean
  croppingImage?: boolean
  viewportFitScale?: number
  currentFocusedLabel?: {
    labelId?: number
    position: XYPosition
  }
  scaleChanged?: boolean
  currentHighlightLabelId?: number
  numPages?: number
} & Pick<PdfViewerProps, 'styles' | 'layout' | 'autoWidth' | 'state'>

export const PdfStateAtom = atom<IPdfState>({})

const usePdfState = () => useAtom(PdfStateAtom)

export default usePdfState
