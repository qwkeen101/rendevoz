import { atom, useAtom } from 'jotai'

export const EditorBarStateAtom = atom<{
  showSearch: boolean
}>({
  showSearch: false
})

const useEditorBarState = () => useAtom(EditorBarStateAtom)

export default useEditorBarState
