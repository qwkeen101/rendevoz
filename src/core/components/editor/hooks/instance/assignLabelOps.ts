import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useSetAtom } from 'jotai'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { goToTextHighlight } from '@/core/components/editor/utils'

const assignLabelOps = (instance: IEditorInstance, editor: CustomEditor) => {
  const setEditorBarState = useSetAtom(EditorBarStateAtom)
  assignProperties(instance, {
    labelOps: {
      addLabel: async label => {
        return await editor.on({
          type: 'addLabel',
          currentLabel: { ...label, name: label.name || 'Unnamed Label' },
          afterAddValue: editor.children
        })
      },
      deleteLabel: async id => {
        await editor.on({ type: 'deleteLabel', labelId: id })
      },
      scrollToLabel: labelId => {
        goToTextHighlight(labelId, editor)
      },
      toggleLabel: () => {
        setEditorBarState(s => ({
          ...s,
          showRightBar: s.rightBarActive === 'label' ? !s.showRightBar : true,
          rightBarActive: 'label'
        }))
      }
    }
  })
}

export default assignLabelOps
