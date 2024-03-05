import { useMemo } from 'react'
import { CustomEditor, CustomElement } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Editor } from 'slate'
import { ReactEditor } from '@/core'

export default (element: CustomElement, editor: CustomEditor) => {
  return useMemo(() => {
    const elementPath = ReactEditor.findPath(editor, element)
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      const isGroup = MetaStore.getMetaObjectsMap().get(element.originId)?.type === 'group'
      if (isGroup) {
        const isInColumn = Editor.above(editor, {
          at: elementPath,
          match: n => n.type === 'column' || n.type === 'synced'
        })
        if (isInColumn) {
          return '100%'
        }
        return 'var(--editor-width)'
      }
    }
    if (element.type === 'table') {
      const isInColumn = Editor.above(editor, {
        at: elementPath,
        match: n => n.type === 'column' || n.type === 'synced'
      })
      if (isInColumn) {
        return '100%'
      }
      return 'var(--editor-width)'
    }
  }, [element.type, element.cardType])
}
