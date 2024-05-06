import { atom, useAtom } from 'jotai'

type IPdfBarState = {
  showRightBar: boolean
  showLeftBar: boolean
  rightBarActive: 'search' | 'label' | 'thumbnail' | 'outline' | 'ai'
  leftBarActive: 'thumbnail' | 'outline'
  leftBarWidth: number
  rightBarWidth: number
}

export const PdfBarStateAtom = atom<IPdfBarState>({
  showRightBar: false,
  showLeftBar: false,
  rightBarActive: 'label',
  leftBarActive: 'thumbnail',
  leftBarWidth: 270,
  rightBarWidth: 400
})

const usePdfBarState = () => useAtom(PdfBarStateAtom)

export default usePdfBarState
