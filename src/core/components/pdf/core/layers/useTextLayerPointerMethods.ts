import { RefObject, useLayoutEffect, useRef } from 'react'
import { useMemoizedFn } from '@/hooks'
import { Point, SelectedTextEvent, TextContentBound, TextRect } from '~/typings'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import { getNearestDistanceBetweenPointAndRect, getTextRect, getWordRect, isInBounds, isInRect, rotateBox } from '../utils/text'
import { Rect } from '@/types'
import { PageViewport } from 'pdfjs-dist'
import { CanvasOriginFillRect } from '@/core/components/pdf/core/layers/CanvasLayer'

const DEFAULT_SELECT_COLOR = 'rgba(39, 158, 255)'
export default (opts: {
  ref: RefObject<HTMLCanvasElement>
  textContentBounds: {
    current: TextContentBound[]
  }
  transformScale: number
  distanceTolerance: number
  width: number
  height: number
  viewport: PageViewport
  pageIndex: number
  onTextSelected?: (e: SelectedTextEvent) => void
}) => {
  const { ref, textContentBounds, transformScale, distanceTolerance, onTextSelected, height, width, viewport, pageIndex } = opts
  const mousePos = useRef<Point | null>(null)
  const rectsRef = useRef<Rect[]>([])
  const emptyTextLayer = () => {
    const canvas = ref.current
    if (!canvas) return
    canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    rectsRef.current = []
  }
  const instance = usePDFInstance()
  const emptyAllPagesTextSelect = () => {
    instance.values.isSelecting = false
    instance.values.selectedText = {}
    Object.values(instance.values.INDEX_TO_PAGE_LAYER).forEach(i => {
      i.clearTextSelect?.()
    })
  }
  const selectText = (startPoint: Point, endPoint: Point, distanceTolerance: number, shouldEmpty = true, color = DEFAULT_SELECT_COLOR) => {
    // out of bounds
    if (startPoint.x < 0 || startPoint.y < 0) return
    // no text / too short select distance
    if (!textContentBounds.current.length || (Math.abs(startPoint.x - endPoint.x) <= 1 && Math.abs(startPoint.y - endPoint.y) <= 1)) return

    // 寻找items的startindex 和 endindex
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
      if (Math.abs(endPoint.x - width) <= 1 && Math.abs(endPoint.y - height) <= 1) {
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
    // 获取到了起始与结束
    startIndex >= 0 &&
      endIndex >= 0 &&
      (startIndex <= endIndex
        ? paintRects(textContentBounds.current.slice(startIndex, endIndex + 1), startPoint, endPoint, shouldEmpty, color)
        : paintRects(textContentBounds.current.slice(endIndex, startIndex + 1), endPoint, startPoint, shouldEmpty, color))
  }
  const paintRects = useMemoizedFn((bounds: TextContentBound[], p1: Point, p2: Point, shouldEmpty = true, color = DEFAULT_SELECT_COLOR) => {
    if (!bounds.length) return
    if (shouldEmpty) {
      emptyTextLayer()
    }
    const isEnd = (point: Point) => {
      return point.x === width && point.y === height
    }
    const tempTextCanvasCtx = document.createElement('canvas').getContext('2d', { alpha: false })!
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
    let text = ''
    optimizedRects.forEach(rect => {
      text += rect.text as string
    })
    instance.values.selectedText[pageIndex] = text
    optimizedRects.forEach(rect => {
      paint(rect, color)
    })
  })
  const paint = (
    coordinate: { x: number; y: number; width: number; height: number; offset?: { angle: number; dx: number; dy: number } },
    color: string,
    opacity = 0.4
  ) => {
    CanvasRenderingContext2D.prototype.fillRect = CanvasOriginFillRect

    const { x, y, width, height, offset } = coordinate
    let rect
    const canvas = ref.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.fillStyle = color
    ctx.globalAlpha = opacity
    if (offset && offset.angle !== undefined) {
      ctx.save()
      ctx.translate(x, y)
      ctx.rotate(offset.angle)
      ctx.translate(offset.dx, offset.dy)
      ctx.fillRect(0, 0, width, height)
      const rotated = rotateBox({
        x,
        y,
        width,
        height,
        offset
      })
      rect = {
        left: rotated.x,
        top: rotated.y,
        width: rotated.width,
        height: rotated.height
      }
      ctx.restore()
    } else {
      ctx.fillRect(x, y, width, height)
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
  const handler = useMemoizedFn(async (e: PointerEvent) => {
    const canvas = ref.current
    if (!canvas) return
    const type = e.type as 'pointerdown' | 'pointerup' | 'pointermove' | 'pointerenter'
    const bounding = canvas.getBoundingClientRect()
    const elX = (e.clientX - bounding.left) / transformScale
    const elY = (e.clientY - bounding.top) / transformScale
    if (type === 'pointerdown') {
      mousePos.current = null
      emptyAllPagesTextSelect()
      if (e.button !== 0) return
      if (isInTextBound({ x: elX, y: elY }, distanceTolerance)) {
        mousePos.current = {
          x: elX,
          y: elY
        }
        instance.values.isSelecting = true
      }
    }
    if (type === 'pointerenter') {
      // select from other pages
      if (!mousePos.current && instance.values.isSelecting) {
        if (elY < 10 || elX < 10) {
          mousePos.current = {
            x: 0,
            y: 0
          }
        } else {
          mousePos.current = {
            x: width,
            y: height
          }
        }
      }
    }
    if (type === 'pointermove' || type === 'pointerup') {
      if (!mousePos.current || type === 'pointerup') {
        if (isInTextBound({ x: elX, y: elY }, distanceTolerance)) {
          canvas.style.cursor = 'text'
        } else {
          canvas.style.cursor = 'default'
        }
      }
      if (type === 'pointermove') {
        const isSelecting = instance.values.isSelecting
        if (isSelecting && mousePos.current) {
          selectText(
            mousePos.current,
            {
              x: elX,
              y: elY
            },
            distanceTolerance
          )
        }
      }
      if (type === 'pointerup' && mousePos.current && rectsRef.current.length !== 0) {
        const selectedText = Object.values(instance.values.selectedText).join(' ')
        onTextSelected?.({
          selectedText,
          e,
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
      }
      if (type === 'pointerup') {
        mousePos.current = null
        instance.values.isSelecting = false
      }
    }
  })
  const dbClickHandler = useMemoizedFn((e: MouseEvent) => {
    const canvas = ref.current
    if (!canvas) return
    const bounding = canvas.getBoundingClientRect()
    const elX = (e.clientX - bounding.left) / transformScale
    const elY = (e.clientY - bounding.top) / transformScale

    if (isInTextBound({ x: elX, y: elY }, distanceTolerance)) {
      mousePos.current = {
        x: elX,
        y: elY
      }
      chooseWord(mousePos.current, distanceTolerance)
      const selectedText = Object.values(instance.values.selectedText).join(' ')
      onTextSelected?.({
        selectedText,
        e,
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
  })
  const chooseWord = (point: Point, distanceTolerance: number) => {
    if (!textContentBounds.current.length || point.x < 0 || point.y < 0 || !ref.current) return
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
    if (!wordRect) return
    instance.values.selectedText = {}
    instance.values.selectedText[pageIndex] = wordRect.text
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
  const isInTextBound = (point: Point, distanceTolerance: number) => {
    return !textContentBounds.current.length || point.x < 0 || point.y < 0
      ? false
      : isInBounds(textContentBounds.current, point, distanceTolerance)
  }
  useLayoutEffect(() => {
    const canvas = ref.current
    if (canvas) {
      const globalPointerUpHandler = () => {
        setTimeout(() => {
          mousePos.current = null
          instance.values.isSelecting = false
        })
      }
      const selectionChangeHandler = () => {
        if (rectsRef.current?.length && window.getSelection()?.toString()) {
          mousePos.current = null
          instance.values.isSelecting = false
          emptyAllPagesTextSelect()
        }
      }
      document.addEventListener('selectionchange', selectionChangeHandler)
      document.addEventListener('pointerup', globalPointerUpHandler)
      canvas.addEventListener('pointerdown', handler)
      canvas.addEventListener('pointermove', handler)
      canvas.addEventListener('pointerup', handler)
      canvas.addEventListener('pointerenter', handler)
      canvas.addEventListener('dblclick', dbClickHandler)
      return () => {
        document.removeEventListener('selectionchange', selectionChangeHandler)
        document.removeEventListener('pointerup', globalPointerUpHandler)
        canvas.removeEventListener('pointerdown', handler)
        canvas.removeEventListener('pointermove', handler)
        canvas.removeEventListener('pointerup', handler)
        canvas.removeEventListener('pointerenter', handler)
        canvas.removeEventListener('dblclick', dbClickHandler)
      }
    }
  })
  return {
    paint,
    emptyAllPagesTextSelect,
    optimizeRects,
    emptyTextLayer
  }
}
