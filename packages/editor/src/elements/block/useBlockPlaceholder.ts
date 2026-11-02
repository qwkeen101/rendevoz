import { CustomEditor, CustomElement, IEditorInstance } from '~/typings'
import { RefObject, useMemo } from 'react'
import { Path, Range } from 'slate'
import { selectAtom } from 'jotai/utils'
import { EditorStateAtom } from '../hooks/useEditorState'
import { useAtomValue } from 'jotai'
const currentFocusBlockId = selectAtom(EditorStateAtom, s => s.currentFocusBlockId)
export default (opts: {
  element: CustomElement
  editor: CustomEditor
  instance: IEditorInstance
  alwaysShowPlaceholder?: boolean
  firstLinePlaceholder?: string
  isComposing?: boolean
  path: Path
  blockRef: RefObject<HTMLElement>
}) => {
  const { element, blockRef, instance, path, editor, isComposing, alwaysShowPlaceholder, firstLinePlaceholder } = opts
  const currentFocus = useAtomValue(currentFocusBlockId, { store: instance.values.editorLevelStore })
  return useMemo(() => {
    if (path.length !== 1) return undefined
    if (isComposing) {
      if (blockRef.current?.hasAttribute('data-selected')) {
        return undefined
      }
    }
    if (alwaysShowPlaceholder !== false) {
      const isBlockEmpty = instance.blockOps?.isBlockEmpty(element)
      if (!isBlockEmpty) return undefined
      if (firstLinePlaceholder) {
        if (Path.equals([0], path)) {
          return true
        }
        return undefined
      }
      const selection = editor.selection
      if (element.type.startsWith('heading') || (selection ? Range.isCollapsed(selection) && Range.includes(selection, path) : true)) {
        return true
      }
    }
  }, [element, path, isComposing, alwaysShowPlaceholder, firstLinePlaceholder])
}
