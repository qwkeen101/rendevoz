import { ObjectStore } from '@/api/stores'
import { ILabel, XYPosition } from '~/typings'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { drawQuadraticBezierCurve } from '@/components/base/canvas/draw'
import { ResizeAndDrag } from '@/components'

function sliceIntoChunks(arr: any[], chunkSize: number) {
  const res = []
  for (let i = 0; i < arr.length; i += chunkSize) {
    const chunk = arr.slice(i, i + chunkSize)
    res.push(chunk)
  }
  return res
}

const InkLabel = ({ labelId, pageSize }: { labelId: number; pageSize: any }) => {
  const inkLabel = ObjectStore('pdfLabel').useValue(labelId) as (ILabel & { type: 'ink' }) | undefined
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [labelPos, setLabelPos] = useState({
    width: 0,
    height: 0,
    left: 0,
    top: 0
  })

  const drawRatio = inkLabel && pageSize.width / inkLabel.drawPdfSize[0]

  const normalizedPoints = inkLabel?.points
  const initialSizeRef = useRef()

  useLayoutEffect(() => {
    const c = canvasRef.current
    if (c && inkLabel && normalizedPoints) {
      const { rect, drawPdfSize } = inkLabel
      const pos = {
        top: rect[0] / drawPdfSize[1],
        left: rect[1] / drawPdfSize[0],
        width: rect[2] / drawPdfSize[0],
        height: rect[3] / drawPdfSize[1]
      }
      c.width = pageSize.width * pos.width
      c.height = pageSize.height * pos.height
      setLabelPos(pos)
      const ctx = c.getContext('2d')!
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      drawPoints(drawRatio || 1, ctx)
    }
  }, [inkLabel, pageSize])

  const drawPoints = (scale: number, ctx: CanvasRenderingContext2D) => {
    if (!normalizedPoints) return
    let beginPoint = undefined
    const pointChunks = sliceIntoChunks(normalizedPoints, 4)
    ctx.scale(scale, scale)
    pointChunks.forEach(i => {
      if (i.length === 4) {
        if (beginPoint === undefined) {
          beginPoint = i[0]
        }
        const { endPoint, controlPoint } = drawQuadraticBezierCurve(i, beginPoint)

        ctx.beginPath()
        ctx.moveTo(beginPoint.x, beginPoint.y)
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 4
        ctx.stroke()
        ctx.closePath()
        beginPoint = endPoint
      }
    })
  }
  return (
    <ResizeAndDrag
      size={{
        width: labelPos.width * pageSize.width,
        height: labelPos.height * pageSize.height
      }}
      enableResizing={false}
      style={{ pointerEvents: 'auto' }}
      position={{
        x: labelPos.left * pageSize.width,
        y: labelPos.top * pageSize.height
      }}
      onResizeStart={(e, dir, ele) => {
        const size = ele.getBoundingClientRect()
        initialSizeRef.current = size
      }}
      lockAspectRatio={true}
      onResize={(e, dir, ele, delta, pos) => {
        const canvas = canvasRef.current
        const currentSize = ele.getBoundingClientRect()
        const scale = currentSize.width / initialSizeRef.current.width
        const ctx = canvas?.getContext('2d')
        if (ctx && inkLabel) {
          canvas.width = currentSize.width
          canvas.height = currentSize.height
          drawPoints(scale, ctx)
        }
      }}
      onDragStop={(e, data) => {
        const ele = e.currentTarget
        const bound = ele.getBoundingClientRect()
        const parentBound = ele.parentElement.getBoundingClientRect()
        const relative = {
          x: (bound.x - parentBound.x) / drawRatio,
          y: (bound.y - parentBound.y) / drawRatio
        }
        const originRect = inkLabel.rect
        const newRect = [relative.y, relative.x, originRect[2], originRect[3]]

        ObjectStore('pdfLabel').updateOne({ id: labelId, rect: newRect })
      }}
    >
      <canvas ref={canvasRef} />
    </ResizeAndDrag>
  )
}

export default InkLabel
