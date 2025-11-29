import { TEXT_TAGS } from '../HTMLTags'
import { jsx } from 'slate-hyperscript'
import normalizeText from './normalizeText'
import Id from '@/utils/id'

export default (
  node: HTMLElement,
  canContainLink = true,
  opts?: {
    ignoreAttributes?: Set<string>
  }
) => {
  const text = TEXT_TAGS[node.nodeName]?.()
  const textContent = normalizeText(node)
  if (textContent?.length) {
    const style = node.style
    const attributes = text || {}
    if (style) {
      if (style.fontStyle) {
        if (style.fontStyle === 'italic') {
          attributes['italic'] = true
        }
      }
      if (style.fontWeight) {
        if (style.fontWeight === 'bold' || style.fontWeight === 'bolder') {
          attributes['bold'] = true
        }
        const numWeight = Number(style.fontWeight)
        if (!Number.isNaN(numWeight)) {
          if (numWeight >= 500) {
            attributes['bold'] = true
          }
        }
      }
    }
    if (opts?.ignoreAttributes?.size) {
      opts.ignoreAttributes.forEach(att => {
        delete attributes[att]
      })
    }
    if (node.nodeType === Node.ELEMENT_NODE) {
      const containLink = node.nodeName === 'A' ? node : node.querySelector('a')
      if (containLink && canContainLink) {
        return jsx('element', { type: 'link', id: Id.getId(), url: containLink.getAttribute('href') }, [
          { text: textContent, ...attributes }
        ])
      }
    }
    return jsx('text', attributes, textContent)
  }
  return null
}
