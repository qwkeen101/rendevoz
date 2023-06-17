import { atom, useAtom } from 'jotai'

type IPdfBarState = {
  showRightBar: boolean
  showLeftBar: boolean
  rightBarActive: 'search' | 'label' | 'thumbnail' | 'outline'
  leftBarActive: 'thumbnail' | 'outline'
  leftBarWidth: number
  rightBarWidth: number
}

export const PdfBarStateAtom = atom<IPdfBarState>({
  showRightBar: false,
  showLeftBar: false,
  rightBarActive: 'search',
  leftBarActive: 'thumbnail',
  leftBarWidth: 300,
  rightBarWidth: 400
})

const usePdfBarState = () => useAtom(PdfBarStateAtom)

export default usePdfBarState
