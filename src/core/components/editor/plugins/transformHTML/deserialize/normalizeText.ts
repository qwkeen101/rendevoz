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
  const prev = node.previousSibling
  let t = text
  t = t.replace(/\n/g, '').replace(/ +/g, ' ')
  if ((prev?.nodeName === 'BR' || (prev && prev.nodeType === Node.TEXT_NODE && prev.textContent === '\n')) && t !== '') {
    t = '\n' + t
  }
  if (t === ' ') return ''
  console.log(node, t, text, prev)
  return t
}
