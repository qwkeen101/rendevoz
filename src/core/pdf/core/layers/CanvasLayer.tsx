import useUpdateIsomorphicLayoutEffect from '@/hooks/utils/useUpdateIsomorphicLayoutEffect'
import { PageViewport, PDFPageProxy, RenderTask } from 'pdfjs-dist'
import { FC, memo, useRef } from 'react'
import { useIsomorphicLayoutEffect } from 'react-use'
import { resizeCanvas } from '../utils/canvas'
import { Background, Font } from '@/consts/colors'
import { useSetting } from '@/core/setting'
import getSetting from '@/core/setting/getSetting'

const MAX_CANVAS_SIZE = 4096 * 4096

interface CanvasLayerProps {
  page: PDFPageProxy
  width: number
  height: number
  viewport: PageViewport
  scale?: number
  transformScale?: number
}
// todo: canvas change render text & background color
export const CanvasOriginFillRect = CanvasRenderingContext2D.prototype.fillRect
const CanvasLayer: FC<CanvasLayerProps> = ({ page, width, height, viewport, transformScale = 1 }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<RenderTask>()
  const renderCanvas = (canvasEle?: HTMLCanvasElement) => {
    if (canvasEle) {
      const outputScale = window.devicePixelRatio || 1
      const maxScale = Math.sqrt(MAX_CANVAS_SIZE / (height * width))
      const shouldRescale = outputScale > maxScale
      shouldRescale ? (canvasEle.style.transform = 'scale(1, 1)') : canvasEle?.style.removeProperty('transform')
      const finalScale = Math.min(maxScale, outputScale) * transformScale
      console.log(transformScale, finalScale, maxScale, outputScale)
      const ctx = canvasEle.getContext('2d', { alpha: false })
      canvasEle.style.height = `${height}px`
      canvasEle.style.width = `${width}px`
      resizeCanvas(ctx, width * finalScale, height * finalScale)
      canvasEle.hidden = true
      const transform = shouldRescale || outputScale !== 1 ? [finalScale, 0, 0, finalScale, 0, 0] : undefined
      renderTaskRef.current = page.render({ canvasContext: ctx, transform, viewport })
      renderTaskRef.current.promise.then(() => {
        canvasEle.hidden = false
      })
    }
  }
  useIsomorphicLayoutEffect(() => {
        const setting = getSetting()
    const fontPrimary = window.getComputedStyle(document.body).getPropertyValue(Font.Primary)
    const backgroundSecondary = window.getComputedStyle(document.body).getPropertyValue(Background.Secondary)
    if (setting.general.darkMode) {
      CanvasRenderingContext2D.prototype.fillText = (function () {
        const original = CanvasRenderingContext2D.prototype.fillText
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = fontPrimary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          return res
        }
      })()
      CanvasRenderingContext2D.prototype.fillRect = (function () {
        const original = CanvasOriginFillRect
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = backgroundSecondary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          return res
        }
      })()
      CanvasRenderingContext2D.prototype.fill = (function () {
        const original = CanvasRenderingContext2D.prototype.fill
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = fontPrimary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          // do something else
          return res
        }
      })()
    }
    const task = renderTaskRef.current
    if (task) {
      task.cancel()
    }
    const canvasEle = canvasRef.current
    renderCanvas(canvasEle)
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
        const setting = getSetting()
    const fontPrimary = window.getComputedStyle(document.body).getPropertyValue(Font.Primary)
    const backgroundSecondary = window.getComputedStyle(document.body).getPropertyValue(Background.Secondary)
    if (setting.general.darkMode) {
      CanvasRenderingContext2D.prototype.fillText = (function () {
        const original = CanvasRenderingContext2D.prototype.fillText
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = fontPrimary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          return res
        }
      })()
      CanvasRenderingContext2D.prototype.fillRect = (function () {
        const original = CanvasOriginFillRect
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = backgroundSecondary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          return res
        }
      })()
      CanvasRenderingContext2D.prototype.fill = (function () {
        const original = CanvasRenderingContext2D.prototype.fill
        return function () {
          const orig = this['fillStyle']
          this['fillStyle'] = fontPrimary
          const res = original.apply(this, arguments)
          this['fillStyle'] = orig
          // do something else
          return res
        }
      })()
    }
    const canvasEle = canvasRef.current
    if (canvasEle) {
      renderCanvas(canvasEle)
    }
  }, [viewport])
  return <canvas ref={canvasRef} style={{ position: 'absolute' }} role="canvas-layer" />
}
export default memo(CanvasLayer)
