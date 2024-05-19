import { atom, useAtom } from 'jotai'

export const EditorBarStateAtom = atom<{
  sidebarWidth: number
  currentActiveLabelId?: number
  sidebarActive: 'search' | 'label' | 'ai' | 'contents' | 'hide' | 'attachments'
}>({
  sidebarActive: 'hide',
  sidebarWidth: 320
})

const useEditorBarState = () => useAtom(EditorBarStateAtom)

export default useEditorBarState
