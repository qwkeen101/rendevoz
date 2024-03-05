import { CustomEditor, CustomElement } from '~/typings'
import { useMemo } from 'react'
import { Editor } from 'slate'
import { ReactEditor } from '@/core'
import { MetaStore } from '@/api/stores'

export default (element: CustomElement, editor: CustomEditor) => {
  return useMemo(() => {
    if (element.type === 'table') {
      const elementPath = ReactEditor.findPath(editor, element)
      const isInColumn = Editor.above(editor, {
        at: elementPath,
        match: n => n.type === 'column' || n.type === 'synced'
      })
      if (isInColumn) {
        return 'column-table'
      }
      return true
    }
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      const isGroup = MetaStore.getMetaObjectsMap().get(element.originId)?.type === 'group'
      if (isGroup) {
        const elementPath = ReactEditor.findPath(editor, element)
        const isInColumn = Editor.above(editor, {
          at: elementPath,
          match: n => n.type === 'column' || n.type === 'synced'
        })
        if (isInColumn) {
          return 'group-in-column'
        }
        return 'group'
      }
    }
    return false
  }, [element])
}
