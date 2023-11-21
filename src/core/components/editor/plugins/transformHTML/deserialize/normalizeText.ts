export default (node: HTMLElement) => {
  const textContent = node.textContent
  if (textContent) {
    // const replaced = textContent.replace(/(?:\r\n|\r|\n|\t)/g, '')
    const trimed = trimNode(node, textContent)
    if (trimed.length) {
      return trimed
    }
  }
}

const trimNode = (node: HTMLElement, text: string) => {
  if (!node.previousSibling && !node.nextSibling) return text.trim()
  if (!node.nextSibling) return text.trimEnd()
  if (!node.previousSibling) return text.trimStart()
  return text
}
