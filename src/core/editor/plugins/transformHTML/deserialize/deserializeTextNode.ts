export default (node: HTMLElement & { nodeType: typeof Node.TEXT_NODE }) => {
  if (!node.previousSibling && !node.nextSibling) return node.textContent?.trim() || ''
  if (!node.nextSibling) return node.textContent?.trimEnd() || ''
  if (!node.previousSibling) return node.textContent?.trimStart() || ''
  return node.textContent || ''
}
