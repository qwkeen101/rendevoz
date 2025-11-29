import deserializeText from '@/core/components/editor/plugins/transformHTML/deserialize/deserializeText'
import { Text } from 'slate'
import { CustomElement } from '~/typings'
import normalizeText from '@/core/components/editor/plugins/transformHTML/deserialize/normalizeText'
import { TEXT_TAGS } from '@/core/components/editor/plugins/transformHTML/HTMLTags'

const recurApplyAttribute = (root: CustomElement | Text, attributes: any) => {
  if (Text.isText(root)) {
    return { ...attributes, ...root }
  } else if ('children' in root && root.children) {
    root.children = root.children.map(c => recurApplyAttribute(c, attributes))
  }
  return root
}

// wrap element text with styles
export default (
  node: HTMLElement,
  opts?: {
    ignoreAttributes?: Set<string>
  }
) => {
  const children = Array.from(node.childNodes)
  const style = node.style

  const attributes = { ...TEXT_TAGS[node.nodeName]?.() }
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
  return children
    .map(c => {
      if (c.nodeType === Node.TEXT_NODE) {
        const t = normalizeText(c)
        if (t) {
          return { text: t, ...attributes }
        }
        return null
      }
      const res = deserializeText(c, node.nodeName !== 'A', opts)
      if (res) {
        return recurApplyAttribute(res, attributes)
      }
    })
    .filter(i => i)
}
