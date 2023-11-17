import { jsx } from 'slate-hyperscript'
import { ElementsAvailableInParagraph } from '@/core/components/editor/plugins/transformHTML/consts'
import { deserializeHTMLChildren } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import normalizeText from './normalizeText'
import MathMl2LaTeX from 'mathml2latex'
import Id from '@/utils/id'

export default (node: HTMLElement) => {
  if (node.classList.contains('ztext-math')) {
    return jsx(
      'element',
      {
        type: 'math',
        content: node.textContent,
        id: Id.getId()
      },
      [{ text: '' }]
    )
  }
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
