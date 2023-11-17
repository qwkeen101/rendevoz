import { ELEMENT_TAGS, TEXT_TAGS } from '@/core/components/editor/plugins/transformHTML/HTMLTags'
import deserializeText from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeText'
import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'
import { deserializeHTMLChildren } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import { ElementsAvailableInParagraph } from '@/core/components/editor/plugins/transformHTML/consts'
import deserializeSpan from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeSpan'
import normalizeText from '@/core/components/editor/plugins/transformHTML/deserialize/normalizeText'

export default (node: HTMLElement) => {
  let shouldBeFragment = true
  // 如果内部有text node就不是fragment，不然就是fragment
  for (const n of node.childNodes) {
    // if children nodes has div or p, be fragment
    if (['DIV', 'P'].includes(n.nodeName)) {
      shouldBeFragment = true
      break
    }
    // has text node, not fragment
    if (n.nodeType === Node.TEXT_NODE) {
      const normalized = normalizeText(n)
      if (normalized?.length) {
        shouldBeFragment = false
      }
    }
    if (TEXT_TAGS[n.nodeName]) {
      const normalized = normalizeText(n)
      if (normalized?.length) {
        shouldBeFragment = false
      }
    }
    // has text element node, not fragment
    if (['SPAN', 'A', 'SUP'].includes(n.nodeName) && n.textContent?.length) {
      shouldBeFragment = false
    }
  }
  // normalize div/p into fragment
  if (shouldBeFragment) {
    return jsx('fragment', {}, deserializeHTMLChildren(node))
  }
  // normalize div/p into paragraph
  else {
    const children: import('slate').Descendant[] = Array.from(node.childNodes)
      .map(i => {
        if (TEXT_TAGS[i.nodeName]) {
          return deserializeText(i)
        }
        if (ElementsAvailableInParagraph.includes(i.nodeName)) {
          const attrs = ELEMENT_TAGS[i.nodeName](i)
          const content = normalizeText(i)
          if (content?.length) {
            return jsx('element', attrs, [{ text: content }])
          }
          return null
        }
        if (i.nodeName === 'SPAN') {
          return deserializeSpan(i)
        }
        const content = normalizeText(i)
        if (content?.length) {
          return jsx('text', {}, content)
        }
        return null
      })
      .filter(i => i)
    return jsx(
      'element',
      {
        type: 'paragraph',
        id: Id.getId()
      },
      children
    )
  }
}
