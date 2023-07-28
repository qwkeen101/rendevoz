import { XYPosition } from '~/typings'
import { drawQuadraticBezierCurve } from './draw'
import Konva from 'konva'

class FreeDrawingManager {
  public drawCanvas?: HTMLCanvasElement
  public layer?: Konva.Layer
  private pointArr: XYPosition[] = []
  private beginPoint?: XYPosition
  public eraserSize = 5
  public pencilSize = 3
  public isDrawing = true
  public startPaint = (pos: XYPosition) => {
    this.beginPoint = pos
    const ctx = this.drawCanvas?.getContext('2d')
    if (ctx) {
      ctx.lineWidth = this.pencilSize
    }
  }

  public paint = (pos: XYPosition) => {
    const ctx = this.drawCanvas?.getContext('2d')

    if (this.beginPoint) {
      this.pointArr.unshift(pos)
    }
    if (this.pointArr.length >= 4 && this.beginPoint && ctx) {
      if (this.isDrawing) {
        ctx.lineWidth = this.pencilSize
      } else {
        ctx.lineWidth = this.eraserSize
      }
      const { endPoint, controlPoint } = drawQuadraticBezierCurve(this.pointArr, this.beginPoint)
      this.pointArr = []

      ctx.beginPath()
      ctx.moveTo(this.beginPoint.x, this.beginPoint.y)
      ctx.quadraticCurveTo(controlPoint.x, controlPoint.y, endPoint.x, endPoint.y)
      ctx.closePath()
      ctx.stroke()
      this.beginPoint = endPoint
      this.layer?.batchDraw()
    }
  }

  public endPaint = () => {
    this.beginPoint = undefined
    this.pointArr = []
  }
}

export default FreeDrawingManager
