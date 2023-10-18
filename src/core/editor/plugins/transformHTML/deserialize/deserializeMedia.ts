import { ELEMENT_TAGS } from '@/core/editor/plugins/transformHTML/HTMLTags'
import { jsx } from 'slate-hyperscript'

export default (node: HTMLElement) => {
  const attrs = ELEMENT_TAGS[node.nodeName](node)
  if ('url' in attrs) {
    if (attrs.url && !attrs.url.includes('base64')) {
      return jsx('element', attrs, [{ text: '' }])
    }
  }
  return null
}
