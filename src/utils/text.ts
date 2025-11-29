export const highlightElementText = (ele: HTMLElement) => {
  if (window.getSelection) {
    const range = document.createRange()
    range.selectNodeContents(ele)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }
}

function getIndicesOf(searchStr, str, caseSensitive) {
  let searchStrLen = searchStr.length
  if (searchStrLen == 0) {
    return []
  }
  let startIndex = 0,
    index,
    indices = []
  if (!caseSensitive) {
    str = str.toLowerCase()
    searchStr = searchStr.toLowerCase()
  }
  while ((index = str.indexOf(searchStr, startIndex)) > -1) {
    indices.push(index)
    startIndex = index + searchStrLen
  }
  return indices
}

export const truncateString = (str: string) => {
  const matches = str.match(/[\u00ff-\uffff]|\S+/g)

  // 20 words for english and chinese
  if (matches && matches.length > 20) {
    const lastWord = matches[20]
    const indices = getIndicesOf(lastWord, str, false)
    const wordIndex = indices.find(i => i >= 20)
    const lastWordIndex = Math.min(20, Math.max(wordIndex, 50)) + lastWord.length
    return str.slice(0, lastWordIndex) + '...'
  }

  // fallback
  if (str.length > 30) {
    return str.slice(0, 30) + '...'
  }
  return str
}

export const getSelectionDirection = () => {
  const selection = window.getSelection()
  if (!selection) throw ''
  if (!selection.isCollapsed) {
    // 检查是否有文本被选中
    const anchorNode = selection.anchorNode // 选择的起始节点
    const focusNode = selection.focusNode // 选择的结束节点
    const anchorOffset = selection.anchorOffset // 起始节点中的位置
    const focusOffset = selection.focusOffset // 结束节点中的位置

    if (anchorNode === focusNode) {
      // 如果起始节点和结束节点是相同的
      if (anchorOffset < focusOffset) {
        return 'down'
      } else {
        return 'up'
      }
    } else {
      // 如果起始节点和结束节点不同
      const range = document.createRange()
      range.setStart(anchorNode, anchorOffset)
      range.setEnd(focusNode, focusOffset)

      if (range.collapsed) {
        return 'up'
      } else {
        return 'down'
      }
    }
  }
}
