import deserializeTextNode from './deserialize/deserializeTextNode'
import deserializeSpan from './deserialize/deserializeSpan'
import { jsx } from 'slate-hyperscript'
import deserializeMedia from './deserialize/deserializeMedia'
import { WrapperNodeNames } from './consts'
import deserializeParagraph from './deserialize/deserializeParagraph'
import deserializeText from './deserialize/deserializeText'
import { ELEMENT_TAGS } from '@/core/components/editor/plugins/transformHTML/HTMLTags'
import normalizeText from '@/core/components/editor/plugins/transformHTML/deserialize/normalizeText'

const NoNestedNodeNames = ['A', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'PRE', 'SUP', 'FIGCAPTION', 'BLOCKQUOTE']

const deserializeHTML = (root: HTMLElement) => {
  // deserialize text node
  if (root.nodeType === Node.TEXT_NODE) {
    return deserializeTextNode(root)
  }
  // if not text node or element node, return null
  if (root.nodeType !== Node.ELEMENT_NODE) return null
  if (WrapperNodeNames.includes(root.nodeName)) {
    return jsx('fragment', {}, deserializeHTMLChildren(root))
  }
  switch (root.nodeName) {
    case 'DIV':
    case 'P':
      return deserializeParagraph(root)
    case 'SPAN':
      return deserializeSpan(root)
    case 'BR':
      return jsx('text', {}, '\n')
    // TODO
    case 'TABLE':
      return null
    case 'IMG':
    case 'AUDIO':
    case 'IFRAME':
      return deserializeMedia(root)
    default: {
      if (ELEMENT_TAGS[root.nodeName]) {
        const attrs = ELEMENT_TAGS[root.nodeName](root)
        let children: any[] = []
        if (NoNestedNodeNames.includes(root.nodeName)) {
          const textContent = normalizeText(root)
          if (textContent?.length) {
            children = [{ text: textContent }]
          }
        } else {
          children = deserializeHTMLChildren(root)
        }
        if (!children) return null
        return jsx('element', attrs, !children.length ? [{ text: '' }] : children)
      }
    }
  }

  // deserialize text elements
  return deserializeText(root)
}

export const deserializeHTMLChildren = (node: HTMLElement) => {
  const res = Array.from(node.childNodes)
    .map(n => deserializeHTML(n))
    .flat()
    .filter(i => i !== null)
  return res
}
export default deserializeHTML
