import { jsx } from 'slate-hyperscript'
import { deserializeHTMLChildren, wrapElements } from '@/core/components/editor/plugins/transformHTML/deserializeHTML'
import { Element } from 'slate'

export default (node: HTMLLIElement) => {
  const parentOL = node.parentNode?.nodeName === 'OL'
  const wrapperName = parentOL ? 'order-list-item' : 'list-item'
  const children = deserializeHTMLChildren(node)
  const wrapped = wrapElements(children, wrapperName)
  const liLevel = getDepth(node)
  console.log(liLevel)
  if (wrapped.length) {
    wrapped.forEach(n => {
      if (Element.isElement(n)) {
        n.level = n.level ?? liLevel
      }
    })
    return jsx('fragment', {}, wrapped)
  }
}

function getDepth(liElement: HTMLLIElement) {
  let depth = -1

  // 检查是否有父级 <ol> 或 <ul> 元素
  function checkParent(element: HTMLElement) {
    if (element.parentNode) {
      if (element.parentNode.nodeName === 'OL' || element.parentNode.nodeName === 'UL' || element.parentNode.nodeName === 'LI') {
        if (element.parentNode.nodeName === 'OL' || element.parentNode.nodeName === 'UL') {
          depth++
        }
        checkParent(element.parentNode)
      }
    }
  }

  checkParent(liElement)
  return depth
}
