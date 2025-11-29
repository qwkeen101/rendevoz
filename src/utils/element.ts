import { mousePos } from '@/hooks/utils/useMousePositionRef'

export const getElementId = (element: Element | null): number | undefined => {
  if (!element) {
    return
  }
  const id = element.getAttribute('id')
  if (id) {
    return parseInt(id)
  }
}

export const scrollToElement = (
  node: HTMLElement,
  opts?: {
    margin?: number
  }
) => {
  const parent = getScrollParent(node)
  if (parent) {
    const divRect = node.getBoundingClientRect()
    const parentRect = parent.getBoundingClientRect()

    // 计算div相对于可滚动父节点的相对top距离
    const relativeTop = divRect.top - parentRect.top + parent.scrollTop
    // element scroll to top
    if (relativeTop < parent.scrollTop) {
      parent.scrollTo({ top: relativeTop - (opts?.margin ?? 0) })
    }
    if (relativeTop > parent.scrollTop + parent.clientHeight) {
      parent.scrollTo({ top: relativeTop - parent.clientHeight + divRect.height + (opts?.margin ?? 0) })
    }
  }
}
function getScrollParent(node: HTMLElement) {
  if (node == null) {
    return null
  }

  if (node.scrollHeight > node.clientHeight) {
    return node
  } else {
    return getScrollParent(node.parentNode)
  }
}

export const getCursorElement = () => {
  const ele = document.elementFromPoint(mousePos.current[0], mousePos.current[1])
  return ele
}
