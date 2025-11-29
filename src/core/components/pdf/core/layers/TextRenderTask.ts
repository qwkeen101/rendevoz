import { PageViewport } from 'pdfjs-dist'
import { TextContent, TextStyle } from 'pdfjs-dist/types/src/display/api'
import { TextContentBound, TextItem } from '~/typings'
import usePdfjs from '@/hooks/utils/usePdfjs'

const DEFAULT_FONT_SIZE = 30
export default class {
  private viewport
  private ctx
  constructor(viewport: PageViewport) {
    this.viewport = viewport
    const canvas = document.createElement('canvas')
    canvas.height = canvas.width = DEFAULT_FONT_SIZE
    this.ctx = canvas.getContext('2d', { alpha: false })!
  }
  isTextItem = (ti: any) => {
    return ti?.['str'] !== undefined
  }
  buildTextBounds = (
    textContent: TextContent
  ): {
    textContentBounds: TextContentBound[]
  } => {
    const textContentBounds: TextContentBound[] = []
    textContent.items.forEach(item => {
      if (this.isTextItem(item)) {
        const i = item as TextItem
        const bound = getTextBound(this.viewport, i, this.ctx, textContent.styles)
        if (bound) {
          textContentBounds.push({ ...bound, str: i.str, textItem: i })
        }
      }
    })
    return { textContentBounds }
  }
  render = (textContent: TextContent) => {
    return this.buildTextBounds(textContent)
  }
}

type styleType = {
  [x: string]: TextStyle
}

function getTextBound(viewport: PageViewport, textItem: TextItem, ctx: CanvasRenderingContext2D, styles: styleType) {
  const textItemTransform = usePdfjs().Util.transform(viewport.transform, textItem.transform)
  let angle = Math.atan2(textItemTransform[1], textItemTransform[0])
  const style = styles[textItem.fontName]
  if (style.vertical) {
    angle += Math.PI / 2
  }
  const height = Math.hypot(textItemTransform[2], textItemTransform[3])
  const ascentFontSize = height * getAscent(style.fontFamily, ctx)
  let left, top
  if (
    (angle === 0
      ? ((left = textItemTransform[4]), (top = textItemTransform[5] - ascentFontSize))
      : ((left = textItemTransform[4] + ascentFontSize * Math.sin(angle)), (top = textItemTransform[5] - ascentFontSize * Math.cos(angle))),
    textItem.str !== '')
  ) {
    let angleCos = 1,
      angleSin = 0
    angle !== 0 && ((angleCos = Math.cos(angle)), (angleSin = Math.sin(angle)))
    const afterScaleWidth = (style.vertical ? textItem.height : textItem.width) * viewport.scale
    let trans, bound
    angle !== 0
      ? ((trans = [angleCos, angleSin, -angleSin, angleCos, left, top]),
        (bound = usePdfjs().Util.getAxialAlignedBoundingBox([0, 0, afterScaleWidth, height], trans)))
      : (bound = [left, top, left + afterScaleWidth, top + height])
    return {
      offset: {
        left: bound[0],
        top: bound[1],
        right: bound[2],
        bottom: bound[3],
        size: [afterScaleWidth, height],
        trans,
        angle
      },
      style: { ...style, fontSize: height }
    }
  }
  return null
}

const ascentCache = new Map()
const DEFAULT_FONT_ASCENT = 0.8
function getAscent(fontFamily: string, ctx: CanvasRenderingContext2D) {
  const ascent = ascentCache.get(fontFamily)
  if (ascent) {
    return ascent
  }
  ctx.save()
  ctx.font = `${DEFAULT_FONT_SIZE}px ${fontFamily}`
  const blankWidth = ctx.measureText('')
  let fontAscent = blankWidth.fontBoundingBoxAscent
  let fontDescent = Math.abs(blankWidth.fontBoundingBoxDescent)
  if (fontAscent) {
    ctx.restore()
    const realAscent = fontAscent / (fontAscent + fontDescent)
    ascentCache.set(fontFamily, realAscent)
    return realAscent
  }
  ctx.strokeStyle = 'red'
  ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE)
  ctx.strokeText('g', 0, 0)
  let imgData = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data
  fontDescent = 0
  for (let i = imgData.length - 4; i >= 0; i -= 4) {
    if (imgData[i] > 0) {
      fontDescent = Math.ceil(i / 4 / DEFAULT_FONT_SIZE)
      break
    }
  }
  ctx.clearRect(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE)
  ctx.strokeText('A', 0, DEFAULT_FONT_SIZE)
  imgData = ctx.getImageData(0, 0, DEFAULT_FONT_SIZE, DEFAULT_FONT_SIZE).data
  fontAscent = 0
  for (let i = 0; i < imgData.length; i += 4) {
    if (imgData[i] > 0) {
      fontAscent = DEFAULT_FONT_SIZE - Math.floor(i / 4 / DEFAULT_FONT_SIZE)
      break
    }
  }
  if ((ctx.restore(), fontAscent)) {
    const _realAscent = fontAscent / (fontAscent + fontDescent)
    return ascentCache.set(fontFamily, _realAscent), DEFAULT_FONT_ASCENT
  }
}
