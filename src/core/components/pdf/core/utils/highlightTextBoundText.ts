import { TextContentBound, TextItemChar } from '~/typings'
import { getCharPoint, getCoordAfterTrans } from '@/core/components/pdf/core/utils/text'
import { PageViewport } from 'pdfjs-dist'

function findChars(array: TextItemChar[], target: string) {
  const targetLength = target.length
  const results = []

  for (let i = 0; i < array.length; i++) {
    let combinedString = ''
    let j = i

    while (j < array.length && combinedString.length < targetLength) {
      combinedString += array[j].unicode
      j++
    }

    if (combinedString.toLowerCase() === target.toLowerCase()) {
      results.push(array.slice(i, j)) // 将符合条件的连续元素添加到结果数组
    }
  }

  return results // 返回所有符合条件的元素
}

export default (text: string, bound: TextContentBound, viewport: PageViewport, ctx: CanvasRenderingContext2D) => {
  const lowerBoundStr = bound.str.toLowerCase()
  const lowerText = text.toLowerCase()
  if (lowerBoundStr.includes(lowerText)) {
    const textItem = bound.textItem
    const charsArray = findChars(textItem.chars, text)
    return charsArray.map(highlightChars => {
      const points = highlightChars.map(i => getCoordAfterTrans(getCharPoint(viewport, i.transform), bound.offset.trans))
      const start = points[0]
      const end = points[points.length - 1]
      const width = end.x - start.x
      const height = bound.offset.size[1]
      const trans = bound.offset.trans
      const boundPos = bound.offset.trans
        ? getCoordAfterTrans(
            {
              x: bound.offset.trans[4],
              y: bound.offset.trans[5]
            },
            bound.offset.trans
          )
        : {
            x: bound.offset.left,
            y: bound.offset.top
          }
      return trans
        ? {
            left: trans[4],
            top: trans[5],
            width,
            height,
            offset: {
              angle: bound.offset.angle,
              dx: start.x - boundPos.x,
              dy: 0
            }
          }
        : {
            left: start.x,
            top: bound.offset.top,
            width,
            height
          }
    })
  }
  if (lowerText.includes(lowerBoundStr)) {
    const trans = bound.offset.trans
    return [
      trans
        ? {
            left: trans[4],
            top: trans[5],
            width: bound.offset.size[1],
            height: bound.offset.size[1]
          }
        : {
            left: bound.offset.left,
            top: bound.offset.top,
            width: bound.offset.size[0],
            height: bound.offset.size[1]
          }
    ]
  }
}
