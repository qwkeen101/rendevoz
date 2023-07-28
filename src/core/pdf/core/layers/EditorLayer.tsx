import { AnnotationEditorLayer } from 'pdfjs-dist'
import { useEffect, useMemo, useRef } from 'react'
import { Canvas } from '@/components'
import { drawQuadraticBezierCurve } from '@/components/base/canvas/draw'
import { getBoundsOfPoints } from '@/utils'
import usePdfInstance from '@/core/pdf/hooks/usePdfInstance'
import useThrottleFn from '@/hooks/utils/useThrottleFn'

const EditorLayer = ({ pageIndex, pageSize }: { pageIndex: number; pageSize: any }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const allPointsRef = useRef([])
  const pointsRef = useRef([])
  const beginPointRef = useRef()
  const isDrawingRef = useRef(false)
  const instance = usePdfInstance()
  const thottledDraw = useThrottleFn(
    (relative, ctx) => {
      allPointsRef.current.push(relative)
      pointsRef.current.unshift(relative)
      if (pointsRef.current.length >= 4) {
        const { endPoint, controlPoint } = drawQuadraticBezierCurve(pointsRef.current, beginPointRef.current)
        pointsRef.current = []

        ctx.beginPath()
        ctx.moveTo(beginPointRef.current.x, beginPointRef.current.y)
        ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
        ctx.closePath()
        ctx.strokeStyle = 'black'
        ctx.lineWidth = 4
        ctx.stroke()
        beginPointRef.current = endPoint
      }
    },
    { wait: 4 }
  )
  useEffect(() => {
    const c = canvasRef.current
    if (c) {
      const parent = c.parentElement
      const computed = window.getComputedStyle(parent)
      c.width = pageSize.width
      c.height = pageSize.height
      const pointerHandler = (e: PointerEvent) => {
        const cBBox = c.getBoundingClientRect()
        const relative = {
          x: e.clientX - cBBox.x,
          y: e.clientY - cBBox.y
        }
        if (e.type === 'pointerdown') {
          isDrawingRef.current = true
          beginPointRef.current = relative
        }
        if (e.type === 'pointermove' && isDrawingRef.current) {
          const ctx = c.getContext('2d')
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'

          thottledDraw.run(relative, ctx)
        }
        if (e.type === 'pointerup') {
          isDrawingRef.current = false
          pointsRef.current = []
          const bounds = getBoundsOfPoints(allPointsRef.current)
          const currentSize = c.getBoundingClientRect()
          const normalizedPoints = allPointsRef.current.map(i => ({
            x: Number((i.x - bounds.minX).toFixed(3)),
            y: Number((i.y - bounds.minY).toFixed(3))
          }))
          instance.insertLabel?.({
            type: 'ink',
            page: pageIndex,
            points: normalizedPoints,
            rect: [bounds.minY, bounds.minX, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY],
            drawPdfSize: [currentSize.width, currentSize.height]
          })
          c.getContext('2d')?.clearRect(0, 0, c.width, c.height)
          allPointsRef.current = []
        }
      }
      c.addEventListener('pointerdown', pointerHandler)
      c.addEventListener('pointermove', pointerHandler)
      c.addEventListener('pointerup', pointerHandler)
      return () => {
        c.removeEventListener('pointerdown', pointerHandler)
        c.removeEventListener('pointermove', pointerHandler)
        c.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [pageSize])
  return (
    <div style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }}>
      <canvas ref={canvasRef} />
    </div>
  )
}

export default EditorLayer
