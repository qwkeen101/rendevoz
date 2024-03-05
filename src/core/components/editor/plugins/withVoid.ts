import { CustomEditor, CustomElement } from '~/typings'
import { EditorTypeToElementMap } from '../maps'

const withVoid = (editor: CustomEditor) => {
  const { isVoid, isInline } = editor
  const voidElementTypeSet = new Set(
    Array.from(EditorTypeToElementMap.values())
      .filter(i => i.isVoid)
      .map(i => i.type)
  )
  const inlineElementTypeSet = new Set(
    Array.from(EditorTypeToElementMap.values())
      .filter(i => i.isInline)
      .map(i => i.type)
  )
  const checkIfVoidComponents = (element: CustomElement) => {
    if (voidElementTypeSet.has(element.type)) return true
    switch (element.type) {
      case 'book-highlight':
      case 'emoji':
      case 'metaObject':
      case 'image':
      case 'thought':
      case 'divider':
      // case 'inline-metaObject':
      case 'code-block':
      case 'math':
        return true
      default:
        return false
    }
  }
  const checkIfInlineElements = (element: CustomElement) => {
    if (inlineElementTypeSet.has(element.type)) return true
    switch (element.type) {
      case 'emoji':
      case 'link':
      case 'sup':
      case 'inline-metapicker':
      case 'inline-metaObject':
      case 'math':
        return true
      default:
        return false
    }
  }
  editor.isInline = element => checkIfInlineElements(element) || isInline(element)
  editor.isVoid = element => {
    return checkIfVoidComponents(element) ? true : isVoid(element)
  }
  return editor
}

export default withVoid
