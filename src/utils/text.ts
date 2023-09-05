import { iso6393To1 } from '@/consts/iso-639-to-iso-631'
import { franc } from 'franc'

export const highlightElementText = (ele: HTMLElement) => {
  if (window.getSelection) {
    const range = document.createRange()
    range.selectNodeContents(ele)
    window.getSelection()?.removeAllRanges()
    window.getSelection()?.addRange(range)
  }
}

export const detectLanguage = (text: string): string | undefined => {
  return iso6393To1[franc(text, { minLength: 1, only: ['eng', 'zho', 'cmn'] })]
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
