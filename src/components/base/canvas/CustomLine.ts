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
      draggable: mode === 'paint' ? true : false,
      strokeWidth: 5,
      globalCompositeOperation: mode === 'paint' ? 'source-over' : 'destination-out',
      hitFunc: (ctx, shape) => {
        ctx.beginPath()
        ctx.moveTo(this.realBegin.x, this.realBegin.y)
        const length = this.drawPoints.length
        let n = 0
        if (length > 1) {
          while (n < length) {
            // const sp = this.drawPoints[n - 1]
            // if (sp) {
            //   ctx.moveTo(sp.x, sp.y)
            // }
            const cp = this.drawPoints[n]
            n++
            const ep = this.drawPoints[n]
            n++
            ctx.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y)
          }
        }
        ctx.fillStrokeShape(shape)
      },
      sceneFunc: (ctx, shape) => {
        ctx.beginPath()
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.moveTo(this.realBegin.x, this.realBegin.y)
        const length = this.drawPoints.length
        let n = 0
        if (length > 1) {
          while (n < length) {
            const sp = this.drawPoints[n - 1]
            if (sp) {
              ctx.moveTo(sp.x, sp.y)
            }
            const cp = this.drawPoints[n]
            n++
            const ep = this.drawPoints[n]
            n++
            ctx.strokeStyle = 'black'
            let ratio
            if (n < length / 2) {
              ratio = n / length
            } else {
              ratio = (length - n) / length
            }
            ctx.lineWidth = 50 * ratio
            ctx.quadraticCurveTo(cp.x, cp.y, ep.x, ep.y)
            ctx.stroke()
            ctx.beginPath()
          }
        }
        // ctx.stroke()
        // ctx.strokeShape(shape)
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
