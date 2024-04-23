import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'

export default (node: HTMLElement) => {
  const text = node.innerText
  if (text.length) {
    return jsx('element', { type: 'pre', id: Id.getId() }, [{ text: text }])
  }
}
