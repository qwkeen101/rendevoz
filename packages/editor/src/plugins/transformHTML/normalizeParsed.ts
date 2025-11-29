import { Descendant, Element, Node, Text } from 'slate'
const normalizeEmptyChildren = (descendant: Descendant[]) => {
  if (!descendant.length) {
    return [{ text: '' }]
  }
  return descendant
}

export const normalize = (descendants: Descendant[]): Descendant[] => {
  const normalized = normalizeEmptyChildren(descendants)
    .map((n, idx, array) => {
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
      if (Text.isText(n) && !n.text) {
        return null
      }
      return n
    })
    .filter(i => i) as Descendant[]
  if (!normalized.length) {
    return [{ text: '' }]
  }
  return normalized
}
