import { jsx } from 'slate-hyperscript'
import Id from '@/utils/id'
import { deserializeHTMLChildren, deserializeRoot } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import { Text } from 'slate'

export default (node: HTMLElement, type = 'paragraph') => {
  let shouldBeFragment = false
  const treeWalker = document.createTreeWalker(node, NodeFilter.SHOW_ELEMENT)
  while (treeWalker.nextNode()) {
    const n = treeWalker.currentNode
    const deserialized = deserializeRoot(n)
    if (deserialized) {
      shouldBeFragment = true
      break
    }
  }
  // normalize div/p into fragment
  if (shouldBeFragment) {
    const children = deserializeHTMLChildren(node)
    const newChildren = children
      .map(i => {
        if (Text.isText(i)) {
          if (i.text.replace(/\n|\r/g, '').trim().length) {
            return {
              type: 'paragraph',
              id: Id.getId(),
              children: [{ text: i.text }]
            }
          }
          return
        }
        return i
      })
      .filter(i => i)
    return jsx('fragment', {}, newChildren)
  }
  // normalize div/p into paragraph
  else {
    const children = deserializeHTMLChildren(node)
    if (children) {
      return jsx(
        'element',
        {
          type,
          id: Id.getId()
        },
        children
      )
    }
  }
}
