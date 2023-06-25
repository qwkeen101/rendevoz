import { atom, useAtom } from 'jotai'

export const EditorBarStateAtom = atom<{
  showSearch: boolean
  showRightBar: boolean
  rightBarActive: 'search' | 'label'
}>({
  showSearch: false,
  showRightBar: false,
  rightBarActive: 'search'
})

const useEditorBarState = () => useAtom(EditorBarStateAtom)

export default useEditorBarState
