import { jsx } from 'slate-hyperscript'
import { ElementsAvailableInParagraph } from '@/core/editor/plugins/transformHTML/consts'
import { deserializeHTMLChildren } from '@/core/editor/plugins/transformHTML/deserializeHTML'

export default (node: HTMLElement) => {
  const children = Array.from(node.childNodes)
  if (children.some(i => ElementsAvailableInParagraph.includes(i.nodeName) && i.textContent?.length)) {
    return jsx('fragment', {}, deserializeHTMLChildren(node))
  }
  const textContent = node.textContent
  const replaced = textContent?.replace(/(?:\r\n|\r|\n)/g, '')
  if (replaced?.length) {
    return jsx('text', {}, textContent)
  }
  return null
}
