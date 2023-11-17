import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useDebounceFn } from '@/hooks'
import { EDITOR_TO_CHANGED } from '@/core'
import { Transforms } from 'slate'
import Id from '@/utils/id'
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
      EDITOR_TO_CHANGED.set(editor, false)
      Transforms.transform(editor, op)
      editor.operations.push(op)
      if (debounce) {
        debounceChangeEditor.run()
      } else {
        changeEditor()
      }
    },
    replaceChildren: (newValue, restoreScrollPosition) => {
      const currentScroll = instance.getScrollPosition?.()
      editor.children = newValue
      editor.selection = null
      normalizeFirstLayer(editor)
      EDITOR_TO_CHANGED.set(editor, false)
      instance.indexPath?.()
      editor.history = {
        redos: [],
        undos: []
      }
      editor.onChange()
    }
  })
}

export default assignValueOps
