import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import { PageViewport, PDFPageProxy, RenderTask, AnnotationMode } from 'pdfjs-dist'
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
export const CanvasOriginFillRect = CanvasRenderingContext2D.prototype.fillRect
export const CanvasOriginFillText = CanvasRenderingContext2D.prototype.fillText
export const CanvasOriginFill = CanvasRenderingContext2D.prototype.fill

const CanvasLayer: FC<CanvasLayerProps> = ({ page, width, height, viewport, pageIndex, pageFunctionRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask>()
  const finalScaleRef = useRef<number>()
  const viewer = usePdfViewer()
  const renderedRef = useRef(false)

  const renderCanvas = useMemoizedFn((canvasEle?: HTMLCanvasElement, onRendered?: VoidFunction, resized?: boolean) => {
    renderTaskRef.current?.cancel()
    if (canvasEle && viewer) {
      const outputScale = Math.max(window.devicePixelRatio || 2, 2)
      const maxScale = Math.sqrt(MAX_CANVAS_SIZE / (height * width))
      const shouldRescale = outputScale > maxScale
      shouldRescale ? (canvasEle.style.transform = 'scale(1, 1)') : canvasEle?.style.removeProperty('transform')

      const finalScale = Math.min(maxScale, outputScale)

      const ctx = canvasEle.getContext('2d', { alpha: false })
      canvasEle.style.height = `${height}px`
      canvasEle.style.width = `${width}px`

      finalScaleRef.current = finalScale
      if (resized) {
        resizeCanvas(ctx, width * finalScale, height * finalScale)
      } else {
        canvasEle.width = width * finalScale
        canvasEle.height = height * finalScale
      }

      if (!renderedRef.current) {
        canvasEle.hidden = true
      }
      const transform = shouldRescale || outputScale !== 1 ? [finalScale, 0, 0, finalScale, 0, 0] : undefined
      debouncedRenderCanvas.run(ctx, transform, viewport, viewer, canvasEle, onRendered)
    }
  })
  const debouncedRenderCanvas = useDebounceFn(
    (ctx: CanvasRenderingContext2D, transform, viewport, viewer, canvasEle, onRendered) => {
      renderTaskRef.current = page.render({
        canvasContext: ctx,
        transform,
        viewport,
        annotationMode: AnnotationMode.ENABLE_STORAGE
      })
      const renderQueue = PDF_TO_RENDER_QUEUE.get(viewer) || new Set<number>()
      PDF_TO_RENDER_QUEUE.set(viewer, renderQueue)
      renderQueue.add(pageIndex)
      renderPageInDarkMode()
      renderTaskRef.current.promise.then(() => {
        canvasEle.hidden = false
        onRendered?.()
        renderedRef.current = true
        setTimeout(() => {
          removeFromRenderQueue(viewer, pageIndex)
        }, 100)
      })
    },
    { wait: 200, trailing: true, leading: true }
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
      renderTaskRef.current = undefined
    }
  }, [])

  useUpdateIsomorphicLayoutEffect(() => {
    const canvasEle = canvasRef.current
    if (canvasEle) {
      console.log('resizing')
      renderCanvas(
        canvasEle,
        () => {
          setTimeout(() => {
            if (canvasEle.width && canvasEle.height) {
              pageFunctionRef.current?.onCanvasRendered?.()
            }
          })
        },
        true
      )
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
