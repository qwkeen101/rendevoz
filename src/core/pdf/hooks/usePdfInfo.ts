import { documentsAtom } from '@/stores/document.store'
import { atom, useAtom, useAtomValue } from 'jotai'
import { selectAtom } from 'jotai/utils'

const PdfIdAtom = atom<number | undefined>(undefined)

export const usePdfId = () => useAtom(PdfIdAtom)

const pdfInfoAtom = atom(get => {
  const pdfId = get(PdfIdAtom)
  if (pdfId) {
    return selectAtom(documentsAtom, d => d.get(pdfId))
  } else {
    return atom(null)
  }
})
const usePdfInfo = () => {
  const innerDocumentAtom = useAtomValue(pdfInfoAtom)
  return useAtomValue(innerDocumentAtom)
}

export default usePdfInfo
