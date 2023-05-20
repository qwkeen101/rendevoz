import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import { PageViewport, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { FC, memo, RefObject, useMemo, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { resizeCanvas } from '../utils/canvas'
import { ICanvasLayerInstance, PageFunctionRef } from '~/typings'
import usePdfViewer from '../hooks/useViewer'
import { PAGE_INDEX_TO_CANVAS_LAYER, PDF_TO_RENDER_QUEUE, removeFromRenderQueue } from '../weakMaps'
import { useDebounceFn, useMemoizedFn } from '@/hooks'
import { renderPageInDarkMode } from '../utils/renderer'

const MAX_CANVAS_SIZE = 4096 * 4096

interface CanvasLayerProps {
  page: PDFPageProxy
  width: number
  height: number
  viewport: PageViewport
  scale?: number
  transformScale?: number
  pageIndex: number
  pageFunctionRef: RefObject<PageFunctionRef>
}
// todo: canvas change render text & background color
export const CanvasOriginFillRect = CanvasRenderingContext2D.prototype.fillRect
export const CanvasOriginFillText = CanvasRenderingContext2D.prototype.fillText
export const CanvasOriginFill = CanvasRenderingContext2D.prototype.fill

const CanvasLayer: FC<CanvasLayerProps> = ({ page, width, height, viewport, transformScale = 1, pageIndex, pageFunctionRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask>()
  const finalScaleRef = useRef<number>()
  const viewer = usePdfViewer()
  const renderedRef = useRef(false)

  const renderCanvas = useMemoizedFn((canvasEle?: HTMLCanvasElement, onRendered?: VoidFunction) => {
    renderTaskRef.current?.cancel()
    if (canvasEle && viewer) {
      const outputScale = window.devicePixelRatio || 1
      const maxScale = Math.sqrt(MAX_CANVAS_SIZE / (height * width))
      const shouldRescale = outputScale > maxScale
      shouldRescale ? (canvasEle.style.transform = 'scale(1, 1)') : canvasEle?.style.removeProperty('transform')
      const finalScale = Math.min(maxScale, outputScale) * transformScale

      const ctx = canvasEle.getContext('2d', { alpha: false })
      canvasEle.style.height = `${height}px`
      canvasEle.style.width = `${width}px`
      finalScaleRef.current = finalScale
      resizeCanvas(ctx, width * finalScale, height * finalScale)
      if (!renderedRef.current) {
        canvasEle.hidden = true
      }
      const transform = shouldRescale || outputScale !== 1 ? [finalScale, 0, 0, finalScale, 0, 0] : undefined
      debouncedRenderCanvas.run(ctx, transform, viewport, viewer, canvasEle, onRendered)
    }
  })
  const debouncedRenderCanvas = useDebounceFn(
    (ctx: CanvasRenderingContext2D, transform, viewport, viewer, canvasEle, onRendered) => {
      const anotherCanvas = document.createElement('canvas')
      anotherCanvas.width = canvasEle.width
      anotherCanvas.height = canvasEle.height
      const anotherCtx = anotherCanvas.getContext('2d')!
      renderTaskRef.current = page.render({ canvasContext: anotherCtx, transform, viewport })
      const renderQueue = PDF_TO_RENDER_QUEUE.get(viewer) || new Set<number>()
      PDF_TO_RENDER_QUEUE.set(viewer, renderQueue)
      renderQueue.add(pageIndex)
      renderPageInDarkMode()
      renderTaskRef.current.promise.then(() => {
        canvasEle.hidden = false
        onRendered?.()
        ctx.drawImage(anotherCanvas, 0, 0, canvasEle.width, canvasEle.height)
        renderedRef.current = true
        setTimeout(() => {
          removeFromRenderQueue(viewer, pageIndex)
        }, 100)
      })
    },
    { wait: 500, trailing: true, leading: true }
  )
  useIsomorphicLayoutEffect(() => {
    const task = renderTaskRef.current
    if (task) {
      task.cancel()
    }
    const canvasEle = canvasRef.current
    if (!canvasEle) return
    renderCanvas(canvasEle, () => {
      setTimeout(() => {
        if (canvasEle.width && canvasEle.height) {
          pageFunctionRef.current?.onCanvasRendered?.()
        }
      })
    })
    return () => {
      // zeroing the width & height to release memory
      if (canvasEle) {
        canvasEle.width = 0
        canvasEle.height = 0
      }
    }
  }, [])

  // do we need to rerender the whole canvas each time viewport change?
  // maybe some canvas libraies can do the resize / zoom without rerendering?
  useUpdateIsomorphicLayoutEffect(() => {
    const canvasEle = canvasRef.current
    if (canvasEle) {
      renderCanvas(canvasEle, () => {
        setTimeout(() => {
          if (canvasEle.width && canvasEle.height) {
            pageFunctionRef.current?.onCanvasRendered?.()
          }
        })
      })
    }
  }, [viewport])
  const canvasLayerInstance = useMemo(() => {
    const i = {
      getCanvasEle: () => canvasRef.current,
      getFinalScale: () => finalScaleRef.current,
      renderPage: (c, cb) => renderCanvas(c, cb)
    } as ICanvasLayerInstance
    return i
  }, [])
  if (viewer) {
    const map = PAGE_INDEX_TO_CANVAS_LAYER.get(viewer) || new Map()
    map.set(pageIndex, canvasLayerInstance)
    PAGE_INDEX_TO_CANVAS_LAYER.set(viewer, map)
  }
  return <canvas ref={canvasRef} style={{ position: 'absolute' }} role="canvas-layer" />
}
export default memo(CanvasLayer)
