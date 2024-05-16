import { CustomEditor, IEditorInstance } from '~/typings'
import { assignProperties } from '@/utils'
import { useSetAtom } from 'jotai'
import { EditorBarStateAtom } from '@/core/components/editor/hooks/useEditorBarState'
import { goToTextHighlight } from '@/core/components/editor/utils'

const assignLabelOps = (instance: IEditorInstance, editor: CustomEditor) => {
  const setEditorBarState = useSetAtom(EditorBarStateAtom)
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openLabelInSidebar: labelId => {
        setEditorBarState(s => ({ ...s, sidebarActive: 'label', currentActiveLabelId: labelId }))
        setTimeout(() => {
          setEditorBarState(s => ({ ...s, currentActiveLabelId: undefined }))
        }, 1500)
      },
      addLabel: async label => {
        return await editor.on({
          type: 'addLabel',
          currentLabel: { ...label, name: label.name },
          afterAddValue: editor.children
        })
      },
      deleteLabel: async id => {
        await editor.on({ type: 'deleteLabel', labelId: id })
      },
      scrollToLabel: labelId => {
        goToTextHighlight(labelId, editor)
      }
    }
  })
}

export default assignLabelOps
