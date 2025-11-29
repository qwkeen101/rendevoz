import usePdfjs from '@/hooks/utils/usePdfjs'
import { PageViewport } from 'pdfjs-dist'
import { Point } from '../types'
import { TextContentBound, TextContentOffset, TextContentTrans } from '../types/text'
import { result } from 'lodash'
import { Box, TextItemChar } from '~/typings'

export const getCoordAfterTrans = (point: Point, trans: TextContentTrans) => {
  if (!trans) return point
  const { x, y } = point
  return {
    x: x * trans[0] + y * trans[1],
    y: x * trans[2] + y * trans[3]
  }
}
export const getCharPoint = (viewport, transform) => {
  const trans = usePdfjs().Util.transform(viewport.transform, transform)
  return {
    x: trans[4],
    y: trans[5]
  }
}
export const getPointsOfRect = (offset: TextContentOffset) => {
  const trans = offset.trans
  if (!trans)
    return [
      {
        x: offset.left,
        y: offset.top
      },
      {
        x: offset.right,
        y: offset.top
      },
      {
        x: offset.right,
        y: offset.bottom
      },
      {
        x: offset.left,
        y: offset.bottom
      }
    ]
  const [width, height] = offset.size,
    leftTop = {
      x: trans[4],
      y: trans[5]
    },
    rightTop = {
      x: leftTop.x + width * trans[0],
      y: leftTop.y + width * trans[1]
    },
    rightBottom = {
      x: leftTop.x - height * trans[1],
      y: leftTop.y + height * trans[0]
    },
    leftBottom = {
      x: rightTop.x + rightBottom.x - leftTop.x,
      y: rightTop.y + rightBottom.y - leftTop.y
    }
  return [leftTop, rightTop, leftBottom, rightBottom]
}
export const getOffsetAfterTrans = (offset: TextContentOffset) => {
  const trans = offset.trans
  if (!trans) return offset
  const [leftTop, , rightBottom] = getPointsOfRect(offset),
    leftTopAfterTrans = getCoordAfterTrans(leftTop, trans),
    rightBottomAfterTrans = getCoordAfterTrans(rightBottom, trans)
  return {
    ...offset,
    left: leftTopAfterTrans.x,
    right: rightBottomAfterTrans.x,
    top: leftTopAfterTrans.y,
    bottom: rightBottomAfterTrans.y
  }
}
export const isInRect = (offset: TextContentOffset, point: Point, distanceTolerance: number) => {
  const coord = getCoordAfterTrans(point, offset.trans)
  const x = coord.x,
    y = coord.y,
    offsetAfterTrans = getOffsetAfterTrans(offset),
    { left, right, top, bottom } = offsetAfterTrans
  return x >= left - distanceTolerance && x <= right + distanceTolerance && y >= top - distanceTolerance && y <= bottom + distanceTolerance
}
export const isInBounds = (bounds: TextContentBound[], point: Point, distanceTolerance: number) => {
  for (let i = 0; i < bounds.length; i += 1) {
    const bound = bounds[i]
    if (isInRect(bound.offset, point, distanceTolerance)) return true
  }
  return false
}
export const getNearestDistanceBetweenPointAndRect = (offset: TextContentOffset, point: Point) => {
  let distance
  if (isInRect(offset, point, 0)) distance = 0
  else {
    const distances = getPointsOfRect(offset).map(rectPoint => Math.pow(point.x - rectPoint.x, 2) + Math.pow(point.y - rectPoint.y, 2))
    distance = Math.min(...distances)
  }
  return distance
}
export const getTargetTextBound = (
  bound: TextContentBound,
  point: Point,
  include: boolean,
  viewport: PageViewport,
  ctx: CanvasRenderingContext2D
) => {
  const pointCoord = getCoordAfterTrans(point, bound.offset.trans),
    boundCoord = bound.offset.trans
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
        },
    pointRelativeX = pointCoord.x - boundCoord.x
  const chars = bound.textItem.chars || []
  ctx.font = `${bound.style.fontSize} ${bound.style.fontFamily}`
  const fontWidth = bound.offset.size[0] / ctx.measureText(bound.str).width
  // not in bound
  if (pointRelativeX <= 0)
    return {
      text: '',
      width: 0
    }
  const resultChars = []
  let relativeRight = 0
  for (let i = 0; i < chars.length; i += 1) {
    const char = chars[i]
    if (!char.transform) {
      resultChars.push(char)
      continue
    }
    const charRelativeRight = getCoordAfterTrans(getCharPoint(viewport, char.transform), bound.offset.trans).x - boundCoord.x
    if (include) {
      if (charRelativeRight >= pointRelativeX) break
      resultChars.push(char), (relativeRight = charRelativeRight)
    } else {
      const charRelativeLeft = charRelativeRight - ctx.measureText(char.unicode as string).width * fontWidth
      if (pointRelativeX >= charRelativeLeft) {
        resultChars.push(char)
        relativeRight = charRelativeRight
      } else {
        break
      }
    }
  }

  const lastChar = resultChars[resultChars.length - 1]
  if (lastChar)
    return {
      text: lastChar.str,
      width: relativeRight,
      chars: resultChars
    }
  let resultStr = ''
  const str = bound.str
  let resultStrWidth = 0
  for (let i = 0; i < str.length; i += 1) {
    resultStr += str[i]
    resultStrWidth = ctx.measureText(resultStr).width * fontWidth
    if (resultStrWidth >= pointRelativeX) {
      break
    }
  }
  if (include && resultStrWidth > pointRelativeX) {
    resultStr = resultStr.substring(0, resultStr.length - 1)
  }

  return {
    text: resultStr,
    width: ctx.measureText(resultStr).width * fontWidth
  }
}
export const getStartTextRect = (bound: TextContentBound, ctx: CanvasRenderingContext2D, point: Point, viewport: PageViewport) => {
  const offset = bound.offset,
    str = bound.str,
    trans = offset.trans,
    textBound = getTargetTextBound(bound, point, true, viewport, ctx)
  let targetStr = str.substring(textBound.text.length)
  bound.textItem.hasEOL && (targetStr += ` `)
  let width = bound.offset.size[0] - textBound.width
  let x = offset.left + textBound.width
  if (targetStr.startsWith(' ') && textBound.chars) {
    const whitespaceWidth = getSpaceWidth(ctx, bound)
    x += whitespaceWidth
    width -= whitespaceWidth
    targetStr = targetStr.trimStart()
  }
  return trans
    ? {
        x: trans[4],
        y: trans[5],
        width: bound.offset.size[0] - textBound.width,
        height: bound.offset.size[1],
        offset: {
          angle: bound.offset.angle,
          dx: textBound.width,
          dy: 0
        },
        text: targetStr
      }
    : {
        x,
        y: offset.top,
        width,
        height: bound.offset.size[1],
        text: targetStr
      }
}
export const getEndTextRect = (bound: TextContentBound, ctx: CanvasRenderingContext2D, point: Point, viewport: PageViewport) => {
  const offset = bound.offset
  const trans = offset.trans
  const textBound = getTargetTextBound(bound, point, false, viewport, ctx),
    targetText = textBound.text
  return trans
    ? {
        x: trans[4],
        y: trans[5],
        width: textBound.width,
        height: bound.offset.size[1],
        offset: {
          angle: bound.offset.angle,
          dx: 0,
          dy: 0
        },
        text: targetText
      }
    : {
        x: offset.left,
        y: offset.top,
        width: textBound.width,
        height: bound.offset.size[1],
        text: targetText
      }
}
export const getTextRect = (bound: TextContentBound, ctx: CanvasRenderingContext2D, points: Point[], viewport: PageViewport) => {
  const offset = bound.offset,
    str = bound.str,
    trans = offset.trans,
    [startPoint, endPoint] = points
  if (startPoint && !endPoint) return getStartTextRect(bound, ctx, startPoint, viewport)
  if (!startPoint && endPoint) return getEndTextRect(bound, ctx, endPoint, viewport)
  if (startPoint && endPoint) {
    const startPointCoord = getCoordAfterTrans(startPoint, offset.trans),
      endPointCoord = getCoordAfterTrans(endPoint, offset.trans),
      [realStart, realEnd] = startPointCoord.x >= endPointCoord.x ? [endPoint, startPoint] : [startPoint, endPoint],
      startTextBound = getTargetTextBound(bound, realStart, true, viewport, ctx),
      endTextBound = getTargetTextBound(bound, realEnd, false, viewport, ctx)
    console.log(startTextBound, endTextBound)
    let width = endTextBound.width - startTextBound.width
    let targetText = str.substring(startTextBound.text.length, endTextBound.text.length)
    let x = offset.left + startTextBound.width
    if (targetText.startsWith(' ')) {
      const spaceWidth = getSpaceWidth(ctx, bound)
      width -= spaceWidth
      x += spaceWidth
    }
    return trans
      ? {
          x: trans[4],
          y: trans[5],
          width,
          height: offset.size[1],
          offset: {
            angle: offset.angle,
            dx: startTextBound.width,
            dy: 0
          },
          text: targetText
        }
      : {
          x,
          y: offset.top,
          width,
          height: offset.size[1],
          text: targetText
        }
  }
  let s = str
  bound.textItem.hasEOL && (s += ` `)
  return trans
    ? {
        x: trans[4],
        y: trans[5],
        width: offset.size[0],
        height: offset.size[1],
        offset: {
          angle: offset.angle,
          dx: 0,
          dy: 0
        },
        text: s
      }
    : {
        x: offset.left,
        y: offset.top,
        width: offset.size[0],
        height: offset.size[1],
        text: s
      }
}
export const getWordRect = (bound: TextContentBound, point: Point, viewport: PageViewport) => {
  const pointPos = getCoordAfterTrans(point, bound.offset.trans)
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
  const relX = pointPos.x - boundPos.x
  const chars = bound.textItem.chars
  const result = []
  let targetCharIdx = 0
  for (; targetCharIdx < chars.length; targetCharIdx += 1) {
    if (!chars[targetCharIdx].transform) {
      continue
    }
    const charPoint = getCharPoint(viewport, chars[targetCharIdx].transform)
    if (getCoordAfterTrans(charPoint, bound.offset.trans).x - boundPos.x >= relX) break
  }
  let tempIdx = targetCharIdx
  // get first char
  while (tempIdx >= 0) {
    const targetChar = chars[tempIdx]
    const prevChar = chars[tempIdx - 1]
    if (prevChar && targetChar) {
      if (isBeforeSpace(prevChar, targetChar)) {
        result.push({
          idx: tempIdx,
          char: prevChar
        })
        break
      } else {
        tempIdx -= 1
      }
    } else {
      result.push(null)
      break
    }
  }
  // get end char
  for (tempIdx = targetCharIdx; tempIdx <= chars.length - 1; ) {
    const targetChar = chars[tempIdx]
    const nextChar = chars[tempIdx + 1]
    if (nextChar) {
      const char = nextChar.str.substring(targetChar.str.length)
      if (/\s/.test(char) || /\x00/.test(char)) {
        result.push({
          idx: tempIdx,
          char: targetChar
        })
        break
      } else {
        tempIdx += 1
      }
    } else {
      result.push({
        idx: tempIdx,
        char: targetChar
      })
      break
    }
  }
  // no end
  if (!result[1]) return null
  let firstCharPos = null
  result[0]
    ? (firstCharPos = getCoordAfterTrans(getCharPoint(viewport, result[0].char.transform), bound.offset.trans))
    : (firstCharPos = boundPos)
  const endCharPos = getCoordAfterTrans(getCharPoint(viewport, result[1].char.transform), bound.offset.trans)
  const trans = bound.offset.trans
  const charRelX = endCharPos.x - firstCharPos.x
  const text = result[1].char.str.substring((result[0] === null ? undefined : result[0].char.str.length) || 0)
  return trans
    ? {
        x: trans[4],
        y: trans[5],
        width: charRelX,
        height: bound.offset.size[1],
        offset: {
          angle: bound.offset.angle,
          dx: firstCharPos.x - boundPos.x,
          dy: 0
        },
        text
      }
    : {
        x: firstCharPos.x,
        y: bound.offset.top,
        width: charRelX,
        height: bound.offset.size[1],
        text
      }
}

export function getSpaceWidth(ctx: CanvasRenderingContext2D, bound: TextContentBound) {
  const fontWidth = bound.offset.size[0] / ctx.measureText(bound.str).width
  return ctx.measureText(' ').width * fontWidth
}

export function rotateBox({
  x,
  y,
  width,
  height,
  offset
}: {
  x: number
  y: number
  width: number
  height: number
  offset: {
    angle: number
    dx: number
    dy: number
  }
}) {
  const angle = offset.angle
  const points = [
    { x: x, y: y }, // 左上
    { x: x + width, y: y }, // 右上
    { x: x + width, y: y + height }, // 右下
    { x: x, y: y + height } // 左下
  ]
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  // 旋转矩形的顶点
  const rotatedPoints = points.map(point => {
    return {
      x: cos * (point.x - x) - sin * (point.y - y) + x,
      y: sin * (point.x - x) + cos * (point.y - y) + y
    }
  })
  const rotatedDx = offset.dx * cos - sin * offset.dy
  const rotatedDy = offset.dx * sin + cos * offset.dy
  const minX = Math.min(...rotatedPoints.map(p => p.x))
  const maxX = Math.max(...rotatedPoints.map(p => p.x))
  const minY = Math.min(...rotatedPoints.map(p => p.y))
  const maxY = Math.max(...rotatedPoints.map(p => p.y))
  const box = {
    x: minX + rotatedDx,
    y: minY + rotatedDy,
    width: maxX - minX,
    height: maxY - minY
  }
  return box
}
export function isBeforeSpace(prev: TextItemChar, current: TextItemChar) {
  const char = current.str.substring(prev.str.length)
  if (/\s/.test(char) || /\x00/.test(char)) {
    return true
  }
  return false
}

export const getCharWidth = (char: TextItemChar, ctx: CanvasRenderingContext2D, bound: TextContentBound) => {
  const fontWidth = bound.offset.size[0] / ctx.measureText(bound.str).width
  return ctx.measureText(char.unicode).width * fontWidth
}