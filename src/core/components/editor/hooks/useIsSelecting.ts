import { atom, useAtom } from 'jotai'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

const isSelectingAtom = atom(false)

const useIsSelecting = () => {
  const i = useEditorInstance()
  const s = i.values.editorLevelStore
  return useAtom(isSelectingAtom, { store: s })
}

export default useIsSelecting
