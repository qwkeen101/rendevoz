import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '../utils'
import { Editor } from 'slate'

const assignTextOps = (instance: IEditorInstance, editor: CustomEditor) => {
  assignProperties(instance, {
    textOps: {
      getBeforeText: (distance, unit = 'character') => {
        const selection = editor.selection
        if (!selection) return
        const prev = Editor.before(editor, selection, {
          distance,
          unit
        })
        if (prev) {
          const text = Editor.string(editor, {
            anchor: prev,
            focus: selection.anchor
          })
          return text
        }
      }
    }
  })
}

export default assignTextOps
