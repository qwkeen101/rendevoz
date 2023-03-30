import { CustomEditor, CustomElement } from '~/typings'

const withVoid = (editor: CustomEditor) => {
  const { isVoid, isInline } = editor
  const checkIfVoidComponents = (element: CustomElement) => {
    switch (element.type) {
      case 'spacer':
        return false
      case 'book-highlight':
      case 'emoji':
      case 'metaObject':
      case 'pdf':
      case 'note':
      case 'image':
      case 'thought':
      case 'divider':
      case 'subPage':
        return true
      default:
        return false
    }
  }
  editor.isInline = element => ['emoji', 'link', 'sup'].includes(element.type) || isInline(element)
  editor.isVoid = element => {
    return checkIfVoidComponents(element) ? true : isVoid(element)
  }
  return editor
}

export default withVoid
