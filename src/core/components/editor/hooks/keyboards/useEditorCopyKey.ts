import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { Node, Path } from 'slate'

const useEditorCopyKey = (instance: IEditorInstance) => {
  const editor = instance.getSlateEditor?.()
  const handleCopyKey = (e: KeyboardEvent) => {
    if (isHotkey('mod+c', e)) {
      const selected = instance.values.selectedBlocks
      if (selected.size > 0) {
        e.preventDefault()
        const selectedElements = Array.from(selected.values()).map(i => i.element)
        selectedElements.sort((b, a) => {
          const bPath = instance.getElementPathById(b.id)
          const aPath = instance.getElementPathById(a.id)
          if (!bPath || !aPath) return 0
          return Path.isBefore(aPath, bPath) ? 1 : -1
        })
        const string = selectedElements.map(i => Node.string(i)).join('\n')
        navigator.clipboard.writeText(string)
        const extended = instance.toggleOps?.extendElements(selectedElements).map(i => i[0])
        if (editor && extended) {
          editor.currentCopyElements = structuredClone(extended)
        }
      }
    }
  }

  return handleCopyKey
}

export default useEditorCopyKey
