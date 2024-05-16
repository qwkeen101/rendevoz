import { TextContentBound } from '~/typings'
import { getCharPoint } from '@/core/components/pdf/core/utils/text'
import { PageViewport } from 'pdfjs-dist'

export default (text: string, bound: TextContentBound, viewport: PageViewport, ctx: CanvasRenderingContext2D) => {
  if (bound.str.includes(text)) {
    const textItem = bound.textItem
    const indice = [...bound.str.matchAll(new RegExp(text, 'gi'))].map(a => a.index)
    return indice.map(idx => {
      const chars = textItem.chars
      const highlightChars = chars.slice(idx, idx + text.length)
      const points = highlightChars.map(i => getCharPoint(viewport, i.transform))
      const start = points[0]
      const end = points[points.length - 1]
      const fontWidth = bound.offset.size[0] / ctx.measureText(bound.str).width
      const firstWidth = ctx.measureText(chars[0].unicode).width * fontWidth
      const width = end.x - start.x + firstWidth
      const height = bound.offset.size[1]
      return {
        left: start.x - firstWidth,
        top: bound.offset.top,
        width,
        height
      }
    })
  }
}
