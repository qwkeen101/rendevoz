import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { assignProperties } from '@/utils'
import useRenderLabelEditor from '@/core/object/renderer/useRenderLabelEditor'
import { getSetting } from '@/core'
import { Editor, Selection, Transforms } from 'slate'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { INoteLabel } from '~/typings'
import { MetaStore, ObjectStore } from '@/api/stores'
import { useRef } from 'react'

export default () => {
  const instance = useEditorInstance()
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType)
  const selectionRef = useRef<Selection>()
  const { renderPopover, labelDetails, open, attachTags } = useRenderLabelEditor<INoteLabel>({
    onCancel: () => {
      const editor = instance.getSlateEditor?.()
      if (editor && selectionRef.current) {
        const selection = selectionRef.current
        selectionRef.current = undefined
        editor.selection = selection
        Editor.removeMark(editor, 'highlight')
      }
    },
    onInsert: (name, tags) => {
      handleInsertNote(labelDetails, name, tags)
    }
  })
  const handleInsertNote = async (l = labelDetails, name?: string, tags?: number[]) => {
    if (l?.id) {
      if (!(await ObjectStore(labelType).getOneById(l.id))) {
        instance.labelOps?.addLabel?.({ ...l, name })
        if (tags?.length) {
          attachTags(l.id, tags)
        }
      } else {
        const labelMeta = MetaStore.getMetaObjectByObjectId(l.id, true)
        if (labelMeta) {
          MetaStore.updateMetaObject({ id: labelMeta.id, name })
        }
      }
    }
  }
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openLabelEditor: async (label, boundingBox, selection, direction) => {
        const setting = getSetting()
        if (setting.editor.autoOpenHighlightEditor === false) {
          const existed = await ObjectStore(labelType).getOneById(label.id)
          if (!existed) {
            setTimeout(() => handleInsertNote(label))
            return
          }
        }
        console.log(selection)
        selectionRef.current = selection
        open(label, boundingBox, direction)
      }
    }
  })
  return renderPopover()
}
