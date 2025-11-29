import { FC, memo, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { PageViewport, PDFPageProxy } from 'pdfjs-dist'
import { rotateBox } from '../utils/text'
import { useMemoizedFn } from '@/hooks'
import { TextContentBound, SelectedTextEvent, TextItemChar } from '~/typings'
import usePDFInstance from '@/core/components/pdf/hooks/usePDFInstance'
import getSearchedTextChars from '@/core/components/pdf/core/utils/getSearchedTextChars'
import { normalizeChars } from '@/core/components/pdf/core/utils/search'
import TextRenderTask from './TextRenderTask'
import useTextLayerPointerMethods from '@/core/components/pdf/core/layers/useTextLayerPointerMethods'
import { waitFor } from '@/utils'
interface TextLayerProps {
  pageIndex: number
  scale: number
  rotation: number
  width: number
  height: number
  viewport: PageViewport
  transformScale?: number
  onTextSelected?: (e: SelectedTextEvent) => void
  onClearTextSelect: VoidFunction
  page: PDFPageProxy
}

const DEFAULT_DISTANCE_TOLERANCE = 6
const DEFAULT_HIGHLIGHT_COLOR = 'rgba(39, 158, 255)'

const TextLayer: FC<TextLayerProps> = ({
  scale,
  rotation,
  onClearTextSelect,
  onTextSelected,
  width,
  height,
  pageIndex,
  viewport,
  transformScale = 1,
  page
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<TextRenderTask>()
  const textContentBounds = useRef<TextContentBound[]>([])
  const distanceToleranceAfterScale = Math.min(16, DEFAULT_DISTANCE_TOLERANCE * scale)
  const instance = usePDFInstance()
  const highlightText = useMemoizedFn(async (text: string, index = 0, paintRed = true) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    await buildText()
    emptyAllPagesTextSelect()
    const lowerText = text.toLowerCase()
    const allChars = textContentBounds.current
      .map(i => i.textItem.chars?.map((c, index) => (c ? { ...c, bound: i, index } : undefined)))
      .flat()
      .filter(i => i)
    const rects = getSearchedTextChars(allChars, lowerText, viewport, ctx)
    rects.forEach((i, idx) => {
      if (i) {
        if (index === idx) {
          const box = i[0]
          const containerOffset = (instance.virtualizer?.scrollElement?.clientHeight ?? 0) / 2
          if (box.offset) {
            const rotated = rotateBox({
              x: box.left,
              y: box.top,
              width: box.width,
              height: box.height,
              offset: box.offset
            })
            instance.navigateOps?.jumpToPage(pageIndex, 'start', rotated.y - containerOffset)
          } else {
            instance.navigateOps?.jumpToPage(pageIndex, 'start', i[0].top - containerOffset)
          }
        }
        i.forEach(rect => {
          if (paintRed) {
            if (idx === index) {
              paint(
                {
                  x: rect.left,
                  y: rect.top,
                  width: rect.width,
                  height: rect.height,
                  offset: rect.offset
                },
                DEFAULT_HIGHLIGHT_COLOR
              )
            }
          } else {
            paint(
              {
                x: rect.left,
                y: rect.top,
                width: rect.width,
                offset: rect.offset,
                height: rect.height
              },
              DEFAULT_HIGHLIGHT_COLOR
            )
          }
        })
      }
    })
  })
  const highlightSentence = useMemoizedFn(async idx => {
    await buildText()
    emptyAllPagesTextSelect()
    const bound = textContentBounds.current[idx]
    if (bound) {
      instance.navigateOps?.jumpToPage(pageIndex, 'center', bound.offset.top)
      const i = bound.offset
      paint(
        {
          x: i.left,
          y: i.top,
          width: i.size[0],
          height: i.size[1]
        },
        DEFAULT_HIGHLIGHT_COLOR
      )
    }
  })
  const { paint, emptyAllPagesTextSelect, emptyTextLayer } = useTextLayerPointerMethods({
    ref: canvasRef,
    textContentBounds: textContentBounds,
    viewport,
    width,
    height,
    pageIndex,
    onTextSelected,
    distanceTolerance: distanceToleranceAfterScale,
    transformScale
  })
  instance.values.INDEX_TO_PAGE_LAYER[pageIndex] = {
    ...instance.values.INDEX_TO_PAGE_LAYER[pageIndex],
    clearTextSelect: () => {
      emptyTextLayer()
      onClearTextSelect()
    },
    highlightText,
    highlightSentence
  }
  useIsomorphicLayoutEffect(() => {
    textContentBounds.current = []
    renderTaskRef.current = undefined
    buildText()
    emptyTextLayer()
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = width
      canvas.height = height
    }
    return () => {
      emptyTextLayer()
      const canvas = canvasRef.current
      if (canvas) {
        canvas.width = 0
        canvas.height = 0
      }
    }
  }, [viewport.height, viewport.width, viewport.scale])
  const buildText = async () => {
    if (instance && !textContentBounds.current.length) {
      await new Promise((res, rej) => {
        if (renderTaskRef.current) {
          waitFor(
            () => textContentBounds.current.length > 0,
            () => res(null),
            {
              onTimeout: () => rej(),
              requestAnimationFrame: true
            }
          )
          return
        }
        const task = new TextRenderTask(viewport)
        renderTaskRef.current = task
        page.getTextContent().then(item => {
          if (item) {
            const { textContentBounds: bounds } = task.render(item)
            textContentBounds.current = bounds
            res(null)
            return
          }
          rej()
        })
      })
    }
  }
  return <canvas ref={canvasRef} style={{ position: 'absolute' }} role="text-layer" />
}

export default memo(TextLayer)
