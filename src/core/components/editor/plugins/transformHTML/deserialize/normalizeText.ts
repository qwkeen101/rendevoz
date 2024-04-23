export default (node: HTMLElement) => {
  let text = ''
  if (node.nodeType === Node.ELEMENT_NODE) {
    text = node.innerText
  } else {
    text = node.textContent || ''
  }
  if (text) {
    if (node.nodeType === Node.TEXT_NODE && text.trim() === '') {
      return ''
    }
    console.log(node, text)
    return text.replace(/[\s\t\r]+/g, function (match) {
      if (match.includes('\n')) {
        return '\n'
      } else {
        return ' '
      }
    })
    // const trimed = trimNode(node, text)
    // if (trimed) return trimed
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
