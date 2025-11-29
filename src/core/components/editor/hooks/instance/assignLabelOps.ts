import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { goToTextHighlight } from '@/core/components/editor/utils'
import { Transforms } from 'slate'
const assignLabelOps = (instance: IEditorInstance, editor: CustomEditor) => {
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      addLabel: async label => {
        return await instance.on({
          type: 'addLabel',
          currentLabel: { ...label, name: label.name },
          afterAddValue: editor.children
        })
      },
      deleteLabel: async id => {
        const ids = Array.isArray(id) ? id : [id]
        const editor = instance.editor
        if (editor) {
          const highlights = ids.map(id => instance.getHighlightLocation(id)).flat()
          if (highlights?.length) {
            highlights.forEach(i => {
              Transforms.setNodes(
                editor,
                {
                  highlight: undefined
                },
                {
                  at: i[1]
                }
              )
            })
          }
        }
        await instance.on({ type: 'deleteLabel', labelId: id })
      },
      scrollToLabel: labelId => {
        goToTextHighlight(labelId, editor)
      }
    }
  })
}

export default assignLabelOps
