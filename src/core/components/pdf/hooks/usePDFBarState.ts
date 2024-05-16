import { atom, useAtom } from 'jotai'

type IPdfBarState = {
  sidebarWidth: number
  sidebarActive: 'search' | 'label' | 'mindmap' | 'ai' | 'thumbnail' | 'outline' | 'hide'
}

export const PdfBarStateAtom = atom<IPdfBarState>({
  sidebarWidth: 300,
  sidebarActive: 'hide'
})

const usePDFBarState = () => useAtom(PdfBarStateAtom)

export default usePDFBarState
