import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'


const useReadOnlyEditor = () => useSelectAtomValue(EditorStateAtom, s => s.readOnly) || false

export default useReadOnlyEditor
