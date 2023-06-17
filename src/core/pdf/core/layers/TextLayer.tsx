import { FC, memo, RefObject, useEffect, useMemo, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { TextContent, TextStyle } from 'pdfjs-dist/types/src/display/api'
import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { getNearestDistanceBetweenPointAndRect, getTextRect, getWordRect, isInBounds, isInRect } from '../utils/text'
import { useMousePositionWithRef } from '@/hooks/utils/useMousePositionRef'
import { Point } from '../types/point'
import { TextContentBound, TextItem, TextRect, TextItemChar } from '../types/text'
import isHotkey from 'is-hotkey'
import { useMemoizedFn, useUnMount } from '@/hooks'
import { PageFunctionRef } from '~/typings'
import useSelectingText from '../hooks/useIsSelectingText'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { Rect } from '@/types'
import { useEventHandler } from '@/events'
import usePdfjs from '@/hooks/utils/usePdfjs'
import { usePdfViewer } from '@/core'
import { ITextLayerInstance } from '~/typings'
import {
  deleteTextContent,
  getTextContent,
  PAGE_INDEX_TO_PAGE_FUNCTION,
  PAGE_INDEX_TO_TEXT_CONTENT,
  PAGE_INDEX_TO_TEXT_LAYER
} from '../weakMaps'
import { CanvasOriginFillRect } from './CanvasLayer'
import { getCharPoint } from '../utils/text'
import { NormalizedMapObject, normalizeText } from '../utils/search'
import { PAGE_SPACING } from '../layouts/Layout'
interface TextLayerProps {
  page: PDFPageProxy
  pageIndex: number
  scale: number
  rotation: number
  width: number
  height: number
  viewport: PageViewport
  pageFunctionRef: RefObject<PageFunctionRef>
  transformScale?: number
}

const DEFAULT_DISTANCE_TOLERANCE = 6
const DEFAULT_HIGHLIGHT_COLOR = '#8590AE'
const DEFAULT_SELECT_COLOR = '#8590AE'

const TextLayer: FC<TextLayerProps> = ({ scale, rotation, width, height, pageIndex, viewport, pageFunctionRef, transformScale = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<TextLayerRenderTask>()
  const tempTextCanvasCtx = document.createElement('canvas').getContext('2d', { alpha: false })
  const textContentBounds = useRef<TextContentBound[]>([])
  const rectsRef = useRef<Rect[]>([])
  const mousePos = useRef<Point | null>(null)
  const mousePosRef = useMousePositionWithRef(canvasRef)
  const selectedTextRef = useRef('')
  const [globalSelectingText, setGlobalSelectingText] = useSelectingText()
  const distanceToleranceAfterScale = Math.min(16, DEFAULT_DISTANCE_TOLERANCE * scale)
  const innerEmitter = useScopedEventEmitter()
  const handler = useEventHandler('pdf')
  const viewer = usePdfViewer()

  handler.on('highlightText', data => {
    if (data.page === pageIndex) {
      const item = textContentBounds.current.find(i => i.str === data.str)
      emptyTextLayer()
      if (item) {
        innerEmitter.removeInterval()
        viewer?.scrollBy?.(item.offset.top - 300)
        paint(
          {
            x: item.offset.left,
            y: item.offset.top,
            width: item.offset.size[0],
            height: item.offset.size[1],
            offset: item.offset.trans
          },
          DEFAULT_HIGHLIGHT_COLOR
        )
      }
    }
  })
  const keyboardHandler = useMemoizedFn((e: KeyboardEvent) => {
    const selectedText = Object.values(globalSelectingText.selectedTexts).join('')
    if (isHotkey('mod+c', e) && selectedText !== '' && window.getSelection()?.toString() === '') {
      navigator.clipboard.writeText(selectedText)
    }
  })
  const mouseEventHandler = useMemoizedFn(async (e: MouseEvent) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const type = e.type as 'mousedown' | 'mouseup' | 'mousemove' | 'dblclick' | 'mouseenter' | 'mouseleave'
    if (type === 'mousedown') {
      mousePos.current = null
    }
    const { elX: unTrX, elY: unTrY } = mousePosRef.current
    const elX = unTrX / transformScale
    const elY = unTrY / transformScale

    if (type === 'mousedown') {
      if (e.button !== 0) return
      if (isInTextBound({ x: elX, y: elY }, distanceToleranceAfterScale)) {
        mousePos.current = {
          x: elX,
          y: elY
        }
      }
      if (rectsRef.current.length != 0) {
        pageFunctionRef.current?.onTextSelectEnd?.()
      }
      setGlobalSelectingText({ ...globalSelectingText, emptyAll: globalSelectingText.emptyAll + 1 })
    }
    if (type === 'dblclick') {
      if (isInTextBound({ x: elX, y: elY }, distanceToleranceAfterScale)) {
        mousePos.current = {
          x: elX,
          y: elY
        }
        chooseWord(mousePos.current, distanceToleranceAfterScale)
        pageFunctionRef.current?.onTextSelected?.({
          selectedText: selectedTextRef.current,
          rects: rectsRef.current.map(rect => {
            return {
              left: rect.left,
              top: rect.top,
              percentageLeft: rect.left / width,
              percentageTop: rect.top / height,
              width: rect.width,
              height: rect.height,
              percentageHeight: rect.height / height,
              percentageWidth: rect.width / width
            }
          })
        })
        mousePos.current = null
      }
    }
    if (type === 'mousemove' || type === 'mouseup') {
      await buildText()
      if (!mousePos.current || type === 'mouseup') {
        if (isInTextBound({ x: elX, y: elY }, 6)) {
          canvas.style.cursor = 'text'
        } else {
          canvas.style.cursor = 'default'
        }
      }
      if (type === 'mousemove' && mousePos.current) {
        selectText(
          mousePos.current,
          { x: mousePosRef.current.elX / transformScale, y: mousePosRef.current.elY / transformScale },
          distanceToleranceAfterScale
        )
        if (!globalSelectingText.isSelecting) {
          setGlobalSelectingText({
            ...globalSelectingText,
            startPage: pageIndex,
            endPage: pageIndex,
            isSelecting: true,
            startPagePoint: mousePos.current,
            selectedTexts: {}
          })
        }
      }
      if (type === 'mouseup' && mousePos.current && rectsRef.current.length !== 0) {
        const selectedText = Object.values(globalSelectingText.selectedTexts).join(' ')
        pageFunctionRef.current?.onTextSelected?.({
          selectedText,
          rects: rectsRef.current.map(rect => {
            return {
              left: rect.left,
              top: rect.top,
              percentageLeft: rect.left / width,
              percentageTop: rect.top / height,
              width: rect.width,
              height: rect.height,
              percentageHeight: rect.height / height,
              percentageWidth: rect.width / width
            }
          })
        })
        setGlobalSelectingText({
          ...globalSelectingText,
          isSelecting: false,
          emptyAll: globalSelectingText.emptyAll
        })
      }
      if (type === 'mouseup') {
        mousePos.current = null
        PAGE_INDEX_TO_PAGE_FUNCTION.get(viewer)?.forEach(v => {
          v.current.clearAllSelect?.()
        })
      }
    }
    if (type === 'mouseleave' && mousePos.current) {
      const { elX, elY, elH, elW } = mousePosRef.current
      // leave from bottom

      if (Math.abs(elH - elY) < 10) {
        if (globalSelectingText.startPage === pageIndex) {
          selectText(mousePos.current, { x: width, y: height }, distanceToleranceAfterScale)
        }
        if (globalSelectingText.startPage! > pageIndex) {
          emptyTextLayer()
        }
      }
      // leave from top
      if (Math.abs(elY) < 10) {
        if (globalSelectingText.startPage === pageIndex) {
          selectText(mousePos.current, { x: 0, y: 0 }, distanceToleranceAfterScale)
        }
        if (globalSelectingText.startPage! < pageIndex) {
          emptyTextLayer()
        }
      }
    }
  })
  useEffect(() => {
    emptyTextLayer()
  }, [globalSelectingText.emptyAll])
  useEffect(() => {
    if (globalSelectingText.isSelecting) {
      // cross page select
      if (globalSelectingText.startPage !== undefined && globalSelectingText.startPage !== pageIndex) {
        // from top to bottom
        if (globalSelectingText.startPage < pageIndex) {
          mousePos.current = {
            x: 0,
            y: 0
          }
        }
        // from bottom to top
        if (globalSelectingText.startPage > pageIndex) {
          mousePos.current = {
            x: width,
            y: height
          }
        }
      }
    } else {
      mousePos.current = null
    }
  }, [globalSelectingText.isSelecting])
  const emptyTextLayer = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    rectsRef.current = []
  }

  if (pageFunctionRef.current) {
    pageFunctionRef.current.clearTextLayer = emptyTextLayer
    pageFunctionRef.current.clearAllSelect = () => {
      mousePos.current = null
    }
    pageFunctionRef.current.getTextLayerCanvas = () => canvasRef.current
  }
  useUnMount(() => {
    if (viewer) {
      deleteTextContent(viewer, pageIndex)
      console.log(PAGE_INDEX_TO_TEXT_CONTENT.get(viewer))
      pageFunctionRef.current = undefined
      renderTaskRef.current = undefined
    }
  })
  const memoizedHighlightText = useMemoizedFn(async text => {
    if (!viewer) return
    const result = await getTextContent(viewer, pageIndex)
    if (!result) return
    await buildText()
    const { hasUnicodeChars, normalizedIndexes, normalizedText } = result
    emptyTextLayer()
    // normalize ligatures to strings
    // weird text transform. Honestly idk wtf is this!
    // copied from https://tex.stackexchange.com/questions/33476/why-cant-fi-be-separated-when-being-copied-from-a-compiled-pdf
    const removeLigRegex = new RegExp(Object.keys(NormalizedMapObject).join('|'), 'g')
    // remove all spaces and normalize search
    const unescaped = text
      .replace(/\s\s+/g, '')
      .replaceAll(' ', '')
      .replace(removeLigRegex, matched => NormalizedMapObject[matched])

    // remove unterminated class to make a regex search
    const searchText = normalizeText(unescaped).replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&')

    const indexes = [...normalizedText.matchAll(new RegExp(searchText, 'gi'))].map(i => i.index)

    let first: Point | undefined = undefined
    indexes.forEach((i, idx) => {
      let beforeCharLongerLength = 0
      let contain = 0
      normalizedIndexes.forEach(ni => {
        if (ni.index <= i) {
          const matchedStr = ni[0]
          const longerLength = NormalizedMapObject[matchedStr].length
          beforeCharLongerLength += longerLength - matchedStr.length
        }
        if (ni.index > i && ni.index <= i + searchText.length) {
          const matchedStr = ni[0]
          const longerLength = NormalizedMapObject[matchedStr].length
          contain = longerLength - matchedStr.length
        }
      })

      const chars = hasUnicodeChars.slice(i - beforeCharLongerLength, i - beforeCharLongerLength + unescaped.length - contain)

      const firstChar = chars[0]

      const lastChar = chars[chars.length - 1]
      const boundCharIdx = textContentBounds.current.findIndex(i => i.textItem.chars?.[0] === firstChar)
      const firstCharPoint =
        boundCharIdx >= 0
          ? {
              x: textContentBounds.current[boundCharIdx].offset.left,
              y: textContentBounds.current[boundCharIdx].offset.top
            }
          : getCharPoint(viewport, firstChar.transform)

      if (idx === 0) {
        first = firstCharPoint
      }
      const lastCharPoint = getCharPoint(viewport, lastChar.transform)
      selectText(firstCharPoint, lastCharPoint, DEFAULT_DISTANCE_TOLERANCE, false, '#FBF719')
    })
    if (first !== undefined) {
      const pageSize = viewer?.getPageSize?.()
      if (pageSize) {
        const offset = pageIndex * (pageSize.height * pageSize.scale) + first.y + PAGE_SPACING * pageIndex

        viewer?.scrollToOffset?.(offset)
      }
    }
  })
  useIsomorphicLayoutEffect(() => {
    renderTaskRef.current = new TextLayerRenderTask(viewport)
    innerEmitter.addListener('pdf', handler)
    textContentBounds.current = []
    console.log('rerender text layer' + pageIndex)
    const globalMouseUpHandler = () => {
      setTimeout(() => {
        mousePos.current = null
      })
    }
    if (viewer) {
      emptyTextLayer()
      const canvas = canvasRef.current
      if (canvas) {
        canvas.addEventListener('mousedown', mouseEventHandler)
        canvas.addEventListener('mousemove', mouseEventHandler)
        canvas.addEventListener('mouseup', mouseEventHandler)
        canvas.addEventListener('dblclick', mouseEventHandler)
        canvas.addEventListener('mouseleave', mouseEventHandler)
        canvas.addEventListener('mouseenter', mouseEventHandler)
        document.addEventListener('pointerup', globalMouseUpHandler)
        canvas.width = width
        canvas.height = height
        const instance = {
          paint,
          paintBounds: (bounds, color) => {
            emptyTextLayer()
            const rects = bounds.map(i => ({
              x: i.offset.left,
              y: i.offset.top,
              width: i.offset.size[0],
              height: i.offset.size[1],
              offset: i.offset.trans
            })) as TextRect[]
            const opti = optimizeRects(rects)
            opti.forEach(i => {
              paint(i, color || DEFAULT_SELECT_COLOR)
            })
          },
          paintItems: (items, color) => {
            const textBounds = textContentBounds.current
            const bounds = items
              .map(i => {
                return textBounds.find(o => o.str === i.str)
              })
              .filter(i => i !== undefined) as TextContentBound[]
            instance.paintBounds(bounds, color)
          }
        } as ITextLayerInstance

        viewer?.onTextLayerRendered?.(pageIndex, instance)
      }
      if (pageFunctionRef.current) {
        pageFunctionRef.current.highlightText = memoizedHighlightText
      }
      document.addEventListener('keydown', keyboardHandler)
    }
    return () => {
      document.removeEventListener('pointerup', globalMouseUpHandler)
      emptyTextLayer()
      innerEmitter.removeListener('pdf', handler)
      const canvas = canvasRef.current
      if (canvas) {
        canvas.removeEventListener('mousedown', mouseEventHandler)
        canvas.removeEventListener('mousemove', mouseEventHandler)
        canvas.removeEventListener('mouseup', mouseEventHandler)
        canvas.removeEventListener('dblclick', mouseEventHandler)
        canvas.removeEventListener('mouseleave', mouseEventHandler)
        canvas.removeEventListener('mouseenter', mouseEventHandler)
        canvas.width = 0
        canvas.height = 0
      }
      document.removeEventListener('keydown', keyboardHandler)
      if (viewer) {
        PAGE_INDEX_TO_TEXT_LAYER.get(viewer)?.delete(pageIndex)
      }
    }
  }, [viewport.height, viewport.width, viewport.scale])
  const buildText = async () => {
    if (viewer && !textContentBounds.current.length) {
      await new Promise(res => {
        getTextContent(viewer, pageIndex).then(item => {
          if (item) {
            const { textContentBounds: bounds } = renderTaskRef.current!.render(item?.textContent)
            textContentBounds.current = bounds
          }
          res(null)
        })
      })
    }
  }
  const isInTextBound = (point: Point, distanceTolerance: number) => {
    return !textContentBounds.current.length || point.x < 0 || point.y < 0
      ? false
      : isInBounds(textContentBounds.current, point, distanceTolerance)
  }
  const selectText = (startPoint: Point, endPoint: Point, distanceTolerance: number, shouldEmpty = true, color = DEFAULT_SELECT_COLOR) => {
    // out of bounds
    if (startPoint.x < 0 || startPoint.y < 0) return
    // no text / too short select distance
    if (!textContentBounds.current.length || (Math.abs(startPoint.x - endPoint.x) <= 1 && Math.abs(startPoint.y - endPoint.y) <= 1)) return

    let startIndex = -1
    let distance = Infinity
    startPoint.x === 0 && startPoint.y === 0 && (startIndex = 0)

    const length = textContentBounds.current.length
    startPoint.x === width && startPoint.y === height && (startIndex = length)
    const indexes = {
      // tolerance index
      insideBoundIndex: -1,
      possibleIndex: -1,
      // no tolerance index
      insideIndex: -1
    }
    for (let i = 0; i < length; i += 1) {
      const textContent = textContentBounds.current[i]
      // get start index
      if (isInRect(textContent.offset, startPoint, distanceTolerance)) {
        const distanceBetweenPointAndRect = getNearestDistanceBetweenPointAndRect(textContent.offset, startPoint)
        if (distanceBetweenPointAndRect < distance) {
          startIndex = i
          distance = distanceBetweenPointAndRect
        }
      }
      if (Math.abs(endPoint.x - viewport.width) <= 1 && Math.abs(endPoint.y - viewport.height) <= 1) {
        indexes.possibleIndex = textContentBounds.current.length - 1
      } else if (isInRect(textContent.offset, endPoint, distanceTolerance)) {
        if (isInRect(textContent.offset, endPoint, 0)) {
          indexes.insideIndex = i
        } else {
          indexes.insideIndex !== 0 && (indexes.insideBoundIndex = i)
        }
      }
    }
    let endIndex =
      indexes.insideIndex >= 0 ? indexes.insideIndex : indexes.insideBoundIndex >= 0 ? indexes.insideBoundIndex : indexes.possibleIndex
    endPoint.x === 0 && endPoint.y === 0 && (endIndex = 0)
    endPoint.x === width && endPoint.y === height && (endIndex = length)
    startIndex >= 0 &&
      endIndex >= 0 &&
      (startIndex <= endIndex
        ? paintRects(textContentBounds.current.slice(startIndex, endIndex + 1), startPoint, endPoint, shouldEmpty, color)
        : paintRects(textContentBounds.current.slice(endIndex, startIndex + 1), endPoint, startPoint, shouldEmpty, color))
  }
  const paint = (coordinate: { x: any; y: any; width: any; height: any; offset: any }, color: string) => {
    CanvasRenderingContext2D.prototype.fillRect = CanvasOriginFillRect

    const { x, y, width, height, offset } = coordinate
    let rect
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = color
    ctx.globalAlpha = 0.5
    if (offset && offset.angle) {
      ctx.fillRect(x + offset.dx, y + offset.dy, width, height)
      rect = {
        left: x + offset.dx,
        top: y + offset.dy,
        width,
        height
      }
    } else {
      ctx.fillRect(x, y, width, height)
      canvas.getContext('2d')
      rect = {
        left: x,
        top: y,
        width,
        height
      }
    }
    rectsRef.current.push(rect)
  }
  const optimizeRects = (rects: TextRect[]) => {
    const optimized: any[] = []
    rects.reduce((prev, curr) => {
      const last = prev[prev.length - 1]
      last && last.y === curr.y ? ((last.width = curr.x - last.x + curr.width), (last.text += curr.text)) : prev.push(curr)
      return prev
    }, optimized)
    optimized.forEach(op => {
      ;['x', 'y', 'width', 'height'].forEach(i => {
        op[i] = Math.round(op[i] * 100) / 100
      })
    })
    return optimized
  }
  const chooseWord = (point: Point, distanceTolerance: number) => {
    if (!textContentBounds.current.length || point.x < 0 || point.y < 0 || !canvasRef.current) return
    let targetIndex = -1,
      distance = Infinity
    for (let i = 0; i < textContentBounds.current.length; i += 1) {
      const textContentBound = textContentBounds.current[i]
      if (isInRect(textContentBound.offset, point, distanceTolerance)) {
        const distanceBetweenPointAndRect = getNearestDistanceBetweenPointAndRect(textContentBound.offset, point)
        distanceBetweenPointAndRect < distance && ((targetIndex = i), (distance = distanceBetweenPointAndRect))
      }
    }
    const targetBound = textContentBounds.current[targetIndex]
    if (!targetBound) return
    const wordRect = getWordRect(targetBound, point, viewport)
    selectedTextRef.current = wordRect?.text
    paint(
      {
        x: wordRect?.x,
        y: wordRect?.y,
        width: wordRect?.width,
        height: wordRect?.height,
        offset: wordRect?.offset
      },
      DEFAULT_SELECT_COLOR
    )
  }
  const paintRects = useMemoizedFn((bounds: TextContentBound[], p1: Point, p2: Point, shouldEmpty = true, color = DEFAULT_SELECT_COLOR) => {
    if (!bounds.length) return
    if (shouldEmpty) {
      emptyTextLayer()
    }
    const isEnd = (point: Point) => {
      return point.x === viewport.width && point.y === viewport.height
    }
    const rects: TextRect[] = []
    if (bounds.length === 1) {
      rects.push(getTextRect(bounds[0], tempTextCanvasCtx, [p1, p2], viewport))
    } else {
      const first = bounds.shift()
      const end = bounds.pop()
      rects.push(getTextRect(first, tempTextCanvasCtx, [p1, null], viewport))
      bounds.forEach((be: any) => {
        rects.push(getTextRect(be, tempTextCanvasCtx, [null, null], viewport))
      })
      rects.push(getTextRect(end, tempTextCanvasCtx, [null, isEnd(p2) ? null : p2], viewport))
    }
    const optimizedRects = optimizeRects(rects)
    selectedTextRef.current = ''
    optimizedRects.forEach(rect => {
      const text = rect.text as string
      selectedTextRef.current += text + ' '
    })
    globalSelectingText.selectedTexts[pageIndex] = selectedTextRef.current
    optimizedRects.forEach(rect => {
      paint(rect, color)
    })
  })

  return <canvas ref={canvasRef} style={{ position: 'absolute' }} role="text-layer" />
}
class TextLayerRenderTask {
  private viewport
  private ctx
  constructor(viewport: PageViewport) {
    this.viewport = viewport
    const canvas = document.createElement('canvas')
    canvas.height = canvas.width = DEFAULT_FONT_SIZE
    this.ctx = canvas.getContext('2d', { alpha: false })
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
const DEFAULT_FONT_SIZE = 30

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
export default memo(TextLayer)
