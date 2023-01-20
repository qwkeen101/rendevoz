import Konva from 'konva'
import { KonvaEventListener } from 'konva/lib/Node'
import { Stage } from 'konva/lib/Stage'
import { throttle } from 'lodash'
import CustomLine from './CustomLine'

class CanvasManager {
  private drawPoint = {
    points: [],
    begin: undefined
  }
  private stage?: Konva.Stage
  private layer?: Konva.Layer
  private isPressed = false
  public isErasing = false
  private lastLine?: CustomLine
  drawLineStart = (x: number, y: number) => {}
  drawLine = throttle((x: number, y: number) => {
    this.lastLine?.appendPoint(x, y)
  }, 16)
  pointerDownHandler: KonvaEventListener<Stage, PointerEvent> = e => {
    this.isPressed = true
    const pos = getRelativePointerPosition(this.stage)
    const customLine = new CustomLine(pos?.x, pos?.y, this.isErasing ? 'erase' : 'paint')
    this.layer?.add(customLine)
    this.lastLine = customLine
  }
  private getPattern = img => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    canvas.width = 100
    canvas.height = 100
    if (ctx) {
      ctx.fillStyle = 'black'
      ctx.fillRect(0, 0, 100, 100)
      ctx.drawImage(img, 0, 0, 100, 100)
    }
    return ctx?.createPattern(canvas, 'repeat')
  }
  pointerMoveHandler: KonvaEventListener<Stage, PointerEvent> = e => {
    if (this.isPressed) {
      const pos = getRelativePointerPosition(this.stage)
      this.drawLine(pos?.x, pos?.y)
    }
  }
  pointerUpHandler: KonvaEventListener<Stage, PointerEvent> = e => {
    this.isPressed = false
  }
  scaleHandler: KonvaEventListener<Stage, WheelEvent> = e => {
    e.evt.preventDefault()
    if (this.stage) {
      const stage = this.stage
      const oldScale = stage.scaleX()
      const pointer = stage.getPointerPosition()
      if (pointer) {
        const mousePointTo = {
          x: (pointer.x - stage.x()) / oldScale,
          y: (pointer.y - stage.y()) / oldScale
        }
        const direction = e.evt.deltaY < 0 ? 1 : -1
        const newScale = direction > 0 ? oldScale * 1.05 : oldScale / 1.05
        stage.scale({ x: newScale, y: newScale })
        const newPos = {
          x: pointer.x - mousePointTo.x * newScale,
          y: pointer.y - mousePointTo.y * newScale
        }
        stage.position(newPos)
      }
    }
  }
  public initialize = (container: HTMLDivElement) => {
    const stage = new Konva.Stage({
      container: container,
      width: window.innerWidth,
      height: window.innerHeight
    })
    stage.on('pointerdown', this.pointerDownHandler)
    stage.on('pointermove', this.pointerMoveHandler)
    stage.on('pointerup', this.pointerUpHandler)
    stage.on('wheel', this.scaleHandler)
    this.stage = stage
    const layer = new Konva.Layer()
    this.layer = layer
    this.stage.add(this.layer)
    const canvas = document.createElement('canvas')
    canvas.width = stage.width()
    canvas.height = stage.height()
    this.offscreenCanvas = canvas
    const image = new Konva.Image({
      image: canvas,
      x: 0,
      y: 0
    })
    layer.add(image)
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.strokeStyle = '#df4b26'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
    }
    return this.layer
  }
  public destory = () => {
    this.stage?.destroy()
  }
}
function getRelativePointerPosition(node) {
  // the function will return pointer position relative to the passed node
  const transform = node.getAbsoluteTransform().copy()
  // to detect relative position we need to invert transform
  transform.invert()

  // get pointer (say mouse or touch) position
  const pos = node.getStage().getPointerPosition()

  // now we find relative point
  return transform.point(pos)
}
export default CanvasManager
