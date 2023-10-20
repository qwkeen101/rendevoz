import { ELEMENT_TAGS, TEXT_TAGS } from '@/core/editor/plugins/transformHTML/HTMLTags'
import deserializeText from '@/core/editor/plugins/transformHTML/deserialize/deserializeText'
import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'
import { deserializeHTMLChildren } from '@/core/editor/plugins/transformHTML/deserializeHTML'
import { ElementsAvailableInParagraph } from '@/core/editor/plugins/transformHTML/consts'
import deserializeSpan from '@/core/editor/plugins/transformHTML/deserialize/deserializeSpan'

export default (node: HTMLElement) => {
  let shouldBeFragment = true
  // 如果内部有text node就不是fragment，不然就是fragment
  for (const n of node.childNodes) {
    console.log(n)
    // if children nodes has div or p, be fragment
    if (['DIV', 'P'].includes(n.nodeName)) {
      shouldBeFragment = true
      break
    }
    // has text node, not fragment
    if (n.nodeType === Node.TEXT_NODE) {
      if (n.textContent?.replace(/(?:\r\n|\r|\n)/g, '').length) {
        shouldBeFragment = false
      }
    }
    if (TEXT_TAGS[n.nodeName]) {
      if (n.textContent?.replace(/(?:\r\n|\r|\n)/g, '').length) {
        shouldBeFragment = false
      }
    }
    // has text element node, not fragment
    if (['SPAN', 'A', 'SUP'].includes(n.nodeName) && n.textContent?.length) {
      shouldBeFragment = false
    }
  }
  console.log(shouldBeFragment, node)
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
          return jsx('element', attrs, [{ text: i.textContent }])
        }
        if (i.nodeName === 'SPAN') {
          return deserializeSpan(i)
        }
        const content = i.textContent
        const replaced = content?.replace(/(?:\r\n|\r|\n)/g, '')
        if (replaced?.length) {
          return jsx('text', {}, i.textContent)
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
