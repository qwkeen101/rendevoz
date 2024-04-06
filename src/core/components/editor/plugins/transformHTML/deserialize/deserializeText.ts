import { TEXT_TAGS } from '../HTMLTags'
import { jsx } from 'slate-hyperscript'
import normalizeText from './normalizeText'

export default (node: HTMLElement) => {
  const text = TEXT_TAGS[node.nodeName]?.()
  const textContent = normalizeText(node)
  if (textContent?.length) {
    const style = node.style
    const attributes = text || {}
    if (style) {
      console.log(style)
      if (style.fontStyle) {
        if (style.fontStyle === 'italic') {
          attributes['italic'] = true
        }
      }
      if (style.color) {
        attributes['fontColor'] = style.color
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
    return jsx('text', attributes, textContent)
  }
  return null
}
