import { jsx } from 'slate-hyperscript'
import { ElementsAvailableInParagraph } from '@/core/editor/plugins/transformHTML/consts'
import { deserializeHTMLChildren } from '@/core/editor/plugins/transformHTML/deserializeHTML'
import normalizeText from './normalizeText'

export default (node: HTMLElement) => {
  const children = Array.from(node.childNodes)
  if (children.some(i => ElementsAvailableInParagraph.includes(i.nodeName) && i.textContent?.length)) {
    return jsx('fragment', {}, deserializeHTMLChildren(node))
  }
  const text = normalizeText(node)
  if (text?.length) {
    return jsx('text', {}, text)
  }
  return null
}
