import { TEXT_TAGS } from '../HTMLTags'
import { jsx } from 'slate-hyperscript'

export default (node: HTMLElement) => {
  const text = TEXT_TAGS[node.nodeName]?.()
  const content = node.textContent
  if (content?.length) {
    return jsx('text', text || {}, content)
  }
}
