import React from 'react'
import { IEditorInstance } from '~/typings'
import { Transforms } from 'slate'

const useEditorSlashMenu = (instance: IEditorInstance) => {
  const handleSlashKeyDown: React.KeyboardEventHandler = e => {
    if (e.code === 'Slash' && !e.altKey && !e.ctrlKey && !e.shiftKey && !e.metaKey) {
      e.preventDefault()
      const editor = instance.getSlateEditor?.()
      if (!editor) return
      Transforms.insertText(editor, '/')
      const currentBlockRect = instance.blockOps?.getCurrentCursorBlockBounding()
      if (currentBlockRect) {
        instance.overlayOps?.open('slashMenu', {
          x: currentBlockRect.left,
          y: currentBlockRect.top + currentBlockRect.height / 2
        })
        return
      }
    }
    return
  }

  return {
    handleSlashKeyDown
  }
}

export default useEditorSlashMenu
