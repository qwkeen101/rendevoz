import { Context } from 'konva/lib/Context'
import { CSSProperties, FC, RefObject, useEffect, useMemo, useRef } from 'react'
import CanvasManager from './CanvasManager'

interface CanvasProps {
  width: number
  height: number
  style: CSSProperties
  innerRef: RefObject<any>
  erase?: boolean
}
interface IShape {
  sceneFunc: (ctx: Context, shape) => void
}

interface CanvasData {
  objects: IShape[]
}
const Canvas: FC<CanvasProps> = ({ width, height, style, innerRef, erase = false }) => {
  const containerRef = useRef<any>()
  const canvasManager = useMemo(() => new CanvasManager(), [])

  useEffect(() => {
    const layer = canvasManager.initialize(containerRef.current)
    innerRef.current = layer.getNativeCanvasElement()
    return () => {
      canvasManager.destory()
    }
  }, [])
  useEffect(() => {
    canvasManager.isErasing = erase
  }, [erase])
  return <div style={{ position: 'absolute', width, height, ...style }} ref={containerRef}></div>
}

export default Canvas
