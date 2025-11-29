import { Box, Point, TextContentBound, TextItemChar } from '~/typings'
import { getCharPoint, getCharWidth, getCoordAfterTrans, getSpaceWidth, isBeforeSpace } from '@/core/components/pdf/core/utils/text'

type WithBoundChar = TextItemChar & {
  bound: TextContentBound
  index: number
}
export default (chars: WithBoundChar[], text: string, viewport: any, ctx: CanvasRenderingContext2D) => {
  const allChars: WithBoundChar[][] = []
  text = text.toLowerCase().replace(/[\s\n]+/g, '')
  const skipIndices = new Set<number>()
  chars.forEach((c, index, arr) => {
    if (skipIndices.has(index)) return
    if (c.unicode.toLowerCase() === text) {
      allChars.push([c])
      return
    }
    let concated = c.unicode.toLowerCase()
    const indices: number[] = [index]
    for (let idx = index + 1; index < arr.length; idx++) {
      const next = arr[idx]
      if (!next) {
        break
      }
      const lower = next.unicode.toLowerCase()
      let shouldContinue = false
      for (let u of lower) {
        if (text.includes(concated + u)) {
          concated += u
          shouldContinue = true
        } else {
          break
        }
      }
      if (!shouldContinue) {
        break
      }
      indices.push(idx)
    }
    if (concated === text) {
      allChars.push(
        indices.map(i => {
          skipIndices.add(i)
          return chars[i]
        })
      )
    }
  })
  console.log(allChars)
  return normalizeChars(allChars, viewport, ctx)
}

// get normalized rects
const normalizeChars = (chars: WithBoundChar[][], viewport: any, ctx: CanvasRenderingContext2D) => {
  return chars.map(i => {
    const rects: (Box & { offset?: any })[] = []
    const skipIndice = new Set<number>()
    i.forEach((char, idx, arr) => {
      if (skipIndice.has(idx)) return
      const bound = char.bound
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
      const charIdx = char.index
      const prevChar = charIdx > 0 ? bound.textItem.chars[charIdx - 1] : undefined
      const beforeSpaceWidth = prevChar ? (isBeforeSpace(prevChar, char) ? getSpaceWidth(ctx, bound) : 0) : 0
      const currentPoint = prevChar
        ? getCoordAfterTrans(getCharPoint(viewport, prevChar.transform), bound.offset.trans)
        : {
            x: boundPos.x,
            y: getCoordAfterTrans(getCharPoint(viewport, char.transform), bound.offset.trans).y
          }
      const points: Point[] = [currentPoint]
      for (let index = idx + 1; index < arr.length; index++) {
        const next = arr[index]
        if (next) {
          const nextBound = next.bound
          const nextPoint = getCoordAfterTrans(getCharPoint(viewport, next.transform), nextBound.offset.trans)
          if (Math.abs(nextPoint.y - currentPoint.y) < 1 || Math.abs(nextPoint.x - currentPoint.x) < 1) {
            points.push(nextPoint)
            skipIndice.add(index)
          } else {
            break
          }
        }
      }
      const start = points[0]
      const end = points[points.length - 1]
      const width = points.length === 1 ? getCharWidth(char, ctx, bound) : end.x - start.x - beforeSpaceWidth
      const height = bound.offset.size[1]
      const trans = bound.offset.trans
      rects.push(
        trans
          ? {
              left: trans[4],
              top: trans[5],
              width,
              height,
              offset: {
                angle: bound.offset.angle,
                dx: start.x - boundPos.x + beforeSpaceWidth,
                dy: 0
              }
            }
          : {
              left: start.x + beforeSpaceWidth,
              top: bound.offset.top,
              width,
              height
            }
      )
    })
    return rects
  })
}
