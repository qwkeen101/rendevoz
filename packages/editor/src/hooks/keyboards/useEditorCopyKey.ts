import { IEditorInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { Node, Path } from 'slate'
import slateToHTML from '../plugins/slateToHTML'

const useEditorCopyKey = (instance: IEditorInstance) => {
  return (e: KeyboardEvent) => {
    if (isHotkey('mod+c', e)) {
      const selected = instance.values.selectedBlocks
      if (selected.size > 0) {
        e.preventDefault()
        const selectedElements = Array.from(selected.values()).map(i => i.element)
        selectedElements.sort((b, a) => {
          const bPath = instance.getElementPathById?.(b.id)
          const aPath = instance.getElementPathById?.(a.id)
          if (!bPath || !aPath) return 0
          return Path.isBefore(aPath, bPath) ? 1 : -1
        })
        const extended = instance.toggleOps?.extendElements(selectedElements).map(i => i[0])
        const { html, text } = slateToHTML(selectedElements, extended)
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([html], { type: 'text/html' }),
            'text/plain': new Blob([text], { type: 'text/plain' })
          })
        ])
      }
    }
  }
}

export default useEditorCopyKey
