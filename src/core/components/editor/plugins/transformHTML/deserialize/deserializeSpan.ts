import { jsx } from 'slate-hyperscript'
import { ElementsAvailableInParagraph } from '@/core/components/editor/plugins/transformHTML/consts'
import { deserializeHTMLChildren } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import normalizeText from './normalizeText'
import Id from '@/utils/id'

export default (node: HTMLElement) => {
  if (node.classList.contains('ztext-math') || node.hasAttribute('data-tex')) {
    return jsx(
      'element',
      {
        type: 'math',
        content: node.textContent,
        id: Id.getId()
      },
      [{ text: node.textContent }]
    )
  }
  return jsx('fragment', {}, deserializeHTMLChildren(node))
}
