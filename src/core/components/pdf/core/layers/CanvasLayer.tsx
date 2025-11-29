import { PageViewport, PDFPageProxy, RenderTask, AnnotationMode } from 'pdfjs-dist'
import { FC, memo, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { useMemoizedFn } from '@/hooks'
import { renderPageInDarkMode } from '../utils/renderer'

const MAX_CANVAS_SIZE = 4096 * 4096

interface CanvasLayerProps {
  page: PDFPageProxy
  width: number
  height: number
  viewport: PageViewport
}
export const CanvasOriginFillRect = CanvasRenderingContext2D.prototype.fillRect
export const CanvasOriginFillText = CanvasRenderingContext2D.prototype.fillText
export const CanvasOriginFill = CanvasRenderingContext2D.prototype.fill

const CanvasLayer: FC<CanvasLayerProps> = ({ page, width, height, viewport }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask>()
  const finalScaleRef = useRef<number>()
  const renderCanvas = useMemoizedFn((canvasEle?: HTMLCanvasElement, onRendered?: VoidFunction) => {
    renderTaskRef.current?.cancel()
    if (canvasEle) {
      const outputScale = Math.max(window.devicePixelRatio || 2, 2)
      const maxScale = Math.sqrt(MAX_CANVAS_SIZE / (height * width))
      const shouldRescale = outputScale > maxScale
      shouldRescale ? (canvasEle.style.transform = 'scale(1, 1)') : canvasEle?.style.removeProperty('transform')

      const finalScale = Math.min(maxScale, outputScale)

      const ctx = canvasEle.getContext('2d', { alpha: false })
      canvasEle.style.height = `${height}px`
      canvasEle.style.width = `${width}px`

      finalScaleRef.current = finalScale
      canvasEle.width = width * finalScale
      canvasEle.height = height * finalScale
      canvasEle.hidden = true
      const transform = shouldRescale || outputScale !== 1 ? [finalScale, 0, 0, finalScale, 0, 0] : undefined
      renderPageInDarkMode()
      renderTaskRef.current = page.render({
        canvasContext: ctx,
        transform,
        viewport,
        annotationMode: AnnotationMode.DISABLE
      })
      renderTaskRef.current.promise.then(() => {
        canvasEle.hidden = false
        onRendered?.()
      })
    }
  })
  useIsomorphicLayoutEffect(() => {
    const task = renderTaskRef.current
    if (task) {
      task.cancel()
    }
    const canvasEle = canvasRef.current
    if (!canvasEle) return
    renderCanvas(canvasEle)
    return () => {
      // zeroing the width & height to release memory
      if (canvasEle) {
        canvasEle.width = 0
        canvasEle.height = 0
      }
      renderTaskRef.current?.cancel()
      renderTaskRef.current = undefined
    }
  }, [viewport])
  return <canvas ref={canvasRef} className={'absolute'} />
}
export default memo(CanvasLayer)
