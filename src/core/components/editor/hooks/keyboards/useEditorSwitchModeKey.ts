import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { useSetAtom } from 'jotai'
import { EditorStateAtom } from '@/core/components/editor/hooks/useEditorState'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

const useEditorSwitchModeKey = (instance: IEditorInstance) => {
  const setEditorState = useSetAtom(EditorStateAtom)
  return (e: KeyboardEvent) => {
    if (isHotkey('mod+e', e)) {
      const container = instance.getScrollElement?.()
      if (container) {
        const element = document.elementFromPoint(mousePos.current[0], mousePos.current[1])
        if (element && container.contains(element)) {
          setEditorState(s => ({ ...s, readOnly: !s.readOnly }))
        }
      }
    }
  }
}

export default useEditorSwitchModeKey
