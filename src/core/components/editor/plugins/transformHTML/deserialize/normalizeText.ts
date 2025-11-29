export default (node: HTMLElement) => {
  let text = ''
  if (node.nodeType === Node.ELEMENT_NODE) {
    text = node.innerText
  } else {
    text = node.textContent || ''
  }
  // if (text) {
  //   return text.replace(/[\s\t\r]+/g, function (match) {
  //     if (match.includes('\n')) {
  //       return '\n'
  //     } else {
  //       return ' '
  //     }
  //   })
  // }
  return text
}
