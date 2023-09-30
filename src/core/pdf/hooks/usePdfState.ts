import { atom, useAtom } from 'jotai'
import { IPdfDocument, XYPosition } from '~/typings'

type IPdfState = {
  pdfId?: number
  document?: IPdfDocument
  autoFitWhenResize?: boolean
  croppingImage?: boolean
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
