import { atom, useAtom } from 'jotai'
import { PdfViewInnerScope } from '../Provider'
import { Point } from '../types'

const isSelectingTextAtom = atom<{
  isSelecting: boolean
  startPage?: number
  startPagePoint?: Point
  endPagePoint?: Point
  endPage?: number
  // page -> selectedText
  selectedTexts: Record<number, string>
  emptyAll: number
}>({
  isSelecting: false,
  selectedTexts: {},
  emptyAll: 0
})

const useSelectingText = () => useAtom(isSelectingTextAtom, PdfViewInnerScope)

export default useSelectingText
