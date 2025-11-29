import { atom, useAtom } from 'jotai'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'

type DragHandleProps = {
  left?: number
  top?: number
  targetHeight?: number
  targetId?: number
  visible?: boolean
  showAdd?: boolean
}
export const EditorBlockHandleAtom = atom<DragHandleProps>({
  visible: false
})

const useEditorBlockHandle = () => {
  const instance = useEditorInstance()
  const store = instance.values.editorLevelStore
  return useAtom(EditorBlockHandleAtom, { store })
}

export default useEditorBlockHandle
