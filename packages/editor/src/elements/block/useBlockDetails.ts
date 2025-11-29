import { useMemo } from 'react'
import { CustomEditor, CustomElement } from '~/typings'
import { MetaStore } from '@/api/stores'
import { Editor } from 'slate'
import { ReactEditor } from '@/core'

const disableOverflowTypes = new Set(['list-item', 'order-list-item', 'synced', 'column', 'columnList'])
export default (element: CustomElement, editor: CustomEditor) => {
  const getOverflow = () => {
    if (disableOverflowTypes.has(element.type)) {
      return 'visible'
    }
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      return 'visible'
    }
    if (element.type === 'table') {
      return 'auto'
    }
    return 'visible'
  }
  const getWidth = () => {
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
  }
  const getPadding = () => {
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
  }
  const getSelectable = () => {
    let selectable = true
    if (['table', 'iframe', 'image'].includes(element.type)) {
      selectable = false
    }
    if (element.type === 'metaObject' && element.cardType === 'embeded') {
      const isGroup = MetaStore.getMetaObjectsMap().get(element.originId)?.type === 'group'
      if (isGroup) {
        selectable = false
      }
    }
    return selectable
  }
  return useMemo(() => {
    return {
      overflow: getOverflow(),
      width: getWidth(),
      padding: getPadding(),
      selectable: getSelectable(),
      isVoid: Editor.isVoid(editor, element)
    }
  }, [element.type, element.cardType])
}
