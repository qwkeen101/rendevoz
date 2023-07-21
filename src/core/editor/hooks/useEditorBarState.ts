import { atom, useAtom } from 'jotai'

export const EditorBarStateAtom = atom<{
  showSearch: boolean
  showLeftBar: boolean
  showRightBar: boolean
  rightBarActive: 'search' | 'label' | 'setting'
}>({
  showSearch: false,
  showLeftBar: false,
  showRightBar: false,
  rightBarActive: 'search'
})

const useEditorBarState = () => useAtom(EditorBarStateAtom)

export default useEditorBarState
