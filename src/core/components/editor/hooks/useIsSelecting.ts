import { atom, useAtom } from 'jotai'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

export const EditorisSelectingAtom = atom(false)

const useIsSelecting = () => {
  const i = useEditorInstance()
  const s = i.values.editorLevelStore
  return useAtom(EditorisSelectingAtom, { store: s })
}

export default useIsSelecting
