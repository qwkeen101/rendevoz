import { atom, useAtom } from 'jotai'
import { IPdfDocument, XYPosition } from '~/typings'

type IPdfState = {
  pdfId?: number
  document?: IPdfDocument
  handDrag?: boolean
  autoFitWhenResize?: boolean
  croppingImage?: boolean
  viewportFitScale?: number
  currentFocusedLabel?: {
    labelId?: number
    position: XYPosition
  }
  currentHighlightLabelId?: number
}

export const PdfStateAtom = atom<IPdfState>({
  autoFitWhenResize: true
})

const usePdfState = () => useAtom(PdfStateAtom)

export default usePdfState
