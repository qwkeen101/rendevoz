import { jsx } from 'slate-hyperscript'
import { deserializeHTMLChildren, wrapElements } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
// todo: support nested list items
export default (node: HTMLElement) => {
  const parentOL = node.parentNode?.nodeName === 'OL'
  const wrapperName = parentOL ? 'order-list-item' : 'list-item'
  const children = deserializeHTMLChildren(node)
  const wrapped = wrapElements(children, wrapperName)
  console.log(children, wrapped)
  if (wrapped.length) {
    return jsx('fragment', {}, wrapped)
  }
}
