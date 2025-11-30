import useEditorInstance from '../hooks/useEditorInstance'
import { assignProperties } from '../utils'
import { Editor, Selection } from 'slate'
import { useSelectAtomValue } from '@/hooks'
import { EditorStateAtom } from '../hooks/useEditorState'
import { INoteLabel } from '~/typings'
import { useRef } from 'react'
import { ToolbarAction } from './EditorSelectionToolbar'

export type QuickLabelOptions = {
  onOpenLabelEditor?: (label: INoteLabel, selection?: Selection) => void
  onInsertLabel?: (label: INoteLabel, name?: string, tags?: number[]) => Promise<void> | void
}

export default ({ onOpenLabelEditor, onInsertLabel }: QuickLabelOptions = {}) => {
  const instance = useEditorInstance()
  const labelType = useSelectAtomValue(EditorStateAtom, s => s.labelType)
  const selectionRef = useRef<Selection>()
  assignProperties(instance, {
    labelOps: {
      ...instance.labelOps,
      openLabelEditor: async (label, boundingBox, selection, direction) => {
        selectionRef.current = selection
        onOpenLabelEditor?.(label, selection)
      }
    }
  })
  return null
}
