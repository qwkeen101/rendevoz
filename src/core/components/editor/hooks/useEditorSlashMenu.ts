import { IEditorInstance } from '~/typings'
import { Transforms } from 'slate'

const useEditorSlashMenu = (instance: IEditorInstance) => {
  return (e: KeyboardEvent) => {
    if (e.code === 'Slash' && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault()
      const editor = instance.editor
      Transforms.insertText(editor, '/')
      setTimeout(() => {
        const currentBlockRect = instance.blockOps?.getCurrentCursorBounding()
        if (currentBlockRect) {
          instance.overlayOps?.open('slashMenu', {
            x: currentBlockRect.left,
            y: currentBlockRect.top + currentBlockRect.height / 2
          })
          return
        }
      })
    }
    return
  }
}

export default useEditorSlashMenu
