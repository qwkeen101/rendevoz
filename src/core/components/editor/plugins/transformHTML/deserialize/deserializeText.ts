import { TEXT_TAGS } from '../HTMLTags'
import { jsx } from 'slate-hyperscript'
import normalizeText from './normalizeText'

export default (node: HTMLElement) => {
  const text = TEXT_TAGS[node.nodeName]?.()
  const textContent = normalizeText(node)
  if (textContent?.length) {
    return jsx('text', text || {}, textContent)
  }
  return null
}
