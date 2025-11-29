import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useDebounceFn } from '@/hooks'
import { Transforms } from 'slate'
import Id from '@/utils/id'
import { useSetAtom } from 'jotai'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
const normalizeFirstLayer = (editor: CustomEditor) => {
  const firstLayerIdSet = new Set<number>()
  editor.children.forEach((i, idx) => {
    if (firstLayerIdSet.has(i.id)) {
      editor.children[idx].id = Id.getId()
    }
    firstLayerIdSet.add(i.id)
  })
}
const assignValueOps = (instance: IEditorInstance, editor: CustomEditor) => {
  const setEditorState = useSetAtom(EditorStateAtom)
  const changeEditor = () => {
    editor.onChange()
    editor.operations = []
  }
  const debounceChangeEditor = useDebounceFn(
    () => {
      changeEditor()
    },
    { wait: 30 }
  )
  assignProperties(instance, {
    applyOperation: (op, debounce) => {
      editor.changeHandled = false
      Transforms.transform(editor, op)
      editor.operations.push(op)
      if (debounce) {
        debounceChangeEditor.run()
      } else {
        changeEditor()
      }
    },
    replaceChildren: (newValue, restoreScrollPosition) => {
      editor.children = newValue
      editor.selection = null
      editor.changeHandled = false
      normalizeFirstLayer(editor)
      instance.indexPath?.()
      editor.history = {
        redos: [],
        undos: []
      }
      setEditorState(s => ({ ...s, editorVersion: (s.editorVersion || 0) + 1 }))
      editor.onChange()
    }
  })
}

export default assignValueOps
