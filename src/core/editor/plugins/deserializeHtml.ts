import { Descendant, Element } from 'slate'
import deserializeHTML from '@/core/editor/plugins/transformHTML/deserializeHTML'
const normalizeEmptyChildren = (descendant: Descendant[]) => {
  if (!descendant.length) {
    return [{ text: '' }]
  }
  return descendant
}

export const normalize = (descendants: Descendant[]) => {
  descendants = normalizeEmptyChildren(descendants)
  descendants = descendants.map((n, idx, array) => {
    if (Element.isElement(n)) {
      if (n.type === 'figcaption') {
        const prev = array[idx - 1]
        if (prev?.type !== 'image') {
          return null
        }
      }
      return {
        ...n,
        children: normalize(n.children)
      }
    }
    return n
  })
  return descendants.filter(i => i) as Descendant[]
}

export { deserializeHTML }
