import { atom, useAtomValue } from 'jotai'
import { IPdfViewer } from '../types/pdfViewer'

export const PdfViewerAtom = atom<IPdfViewer | null>(null)

const usePdfViewer = () => useAtomValue(PdfViewerAtom)
export default usePdfViewer
