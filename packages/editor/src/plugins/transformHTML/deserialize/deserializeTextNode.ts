import normalizeText from './normalizeText'
import { jsx } from 'slate-hyperscript'

export default (node: HTMLElement & { nodeType: typeof Node.TEXT_NODE }) => {
  const text = normalizeText(node, node.textContent || '')
  if (text?.length) {
    return jsx('text', {}, text)
  }
  return null
}
