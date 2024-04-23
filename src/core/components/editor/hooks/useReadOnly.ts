import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { selectAtom } from 'jotai/utils'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useAtomValue } from 'jotai'

const readOnlyAtom = selectAtom(EditorStateAtom, s => s.readOnly)
const useReadOnlyEditor = () => {
  const instance = useEditorInstance()
  return useAtomValue(readOnlyAtom, { store: instance.values.editorLevelStore })
}

export default useReadOnlyEditor
