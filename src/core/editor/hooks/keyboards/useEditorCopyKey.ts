import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'

const useEditorCopyKey = (instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  const handleCopyKey = (e: KeyboardEvent) => {
    if (isHotkey('mod+c', e)) {
      const selected = instance.values.selectedBlocks
      if (selected.size > 0) {
        e.preventDefault()
        const selectedElements = Array.from(selected.values()).map(i => i.element)
        if(editor){
          editor.currentCopyElements = selectedElements
        }
      }
    }
  }

  return handleCopyKey
}

export default useEditorCopyKey
