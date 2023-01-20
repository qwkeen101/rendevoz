import { content } from 'html2canvas/dist/types/css/property-descriptors/content'
import Konva from 'konva'
import { Context } from 'konva/lib/Context'
import { drawQuadraticBezierCurve } from './draw'

class CustomLine extends Konva.Shape {
  private realBegin?: { x: number; y: number }
  private begin?: { x: number; y: number }
  private _points: { x: number; y: number }[] = []
  private drawPoints: { x: number; y: number }[] = []
  constructor(x: number, y: number, mode: 'erase' | 'paint' = 'paint') {
    super({
      stroke: 'red',
      lineCap: 'round',
      lineJoin: 'round',
      perfectDrawEnabled: false,
      listening: false,
      // draggable: mode === 'paint' ? true : false,
      strokeWidth: 5,
      // globalCompositeOperation: mode === 'paint' ? 'source-over' : 'destination-out',
      globalCompositeOperation: 'source-over',
      shadowForStrokeEnabled: false,
      hitStrokeWidth: 0,
      sceneFunc: (ctx, shape) => {
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        if (!this.realBegin) return
        const length = this.drawPoints.length
        let n = 0
        if (length > 1) {
          while (n < length) {
            const pathInner = new Path2D()
            const pathOuter = new Path2D()
            const sp = this.drawPoints[n - 1]
            if (sp) {
              pathInner.moveTo(sp.x, sp.y)
              pathOuter.moveTo(sp.x, sp.y)
            }
            const cp = this.drawPoints[n]
            n++
            const ep = this.drawPoints[n]
            n++
            ctx.strokeStyle = 'red'
            ctx.lineWidth = 13
            pathOuter.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y)
            ctx.globalCompositeOperation = 'destination-over'
            ctx.stroke(pathOuter)
            pathOuter.closePath()
            ctx.globalCompositeOperation = 'source-over'
            ctx.strokeStyle = 'white'
            ctx.lineWidth = 11
            pathInner.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y)
            ctx.stroke(pathInner)
            pathInner.closePath()
          }
        }
      }
    })
    this.begin = {
      x,
      y
    }
    this.realBegin = {
      x,
      y
    }
    this._points.push({ x, y })
  }

  public appendPoint(x: number, y: number) {
    const point = { x, y }
    this._points.unshift(point)
    if (this._points.length >= 4 && this.begin) {
      const { controlPoint, endPoint } = drawQuadraticBezierCurve(this._points, this.begin)
      this.begin = endPoint
      this.drawPoints.push(controlPoint)
      this.drawPoints.push(endPoint)
      this.clearCache()
      this.draw()
    }
  }
}

export default CustomLine
