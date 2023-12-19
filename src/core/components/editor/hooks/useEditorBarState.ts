import { atom, useAtom } from 'jotai'

export const EditorBarStateAtom = atom<{
  showSearch: boolean
  showLeftBar: boolean
  rightBarWidth?: number
  showRightBar: boolean
  rightBarActive: 'search' | 'label' | 'setting' | 'ai'
  currentActiveLabelId?: number
}>({
  showSearch: false,
  showLeftBar: false,
  showRightBar: false,
  rightBarActive: 'search'
})

const useEditorBarState = () => useAtom(EditorBarStateAtom)

export default useEditorBarState
