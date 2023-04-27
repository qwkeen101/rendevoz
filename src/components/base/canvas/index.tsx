import { Context } from 'konva/lib/Context'
import { CSSProperties, FC, RefObject, useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import CanvasManager from './CanvasManager'
import { useStore } from 'jotai'
import { CanvasManagerAtom } from '@/core/image/ImageDisplayer'

interface CanvasProps {
  width: number
  height: number
  style: CSSProperties
  innerRef: RefObject<any>
  erase?: boolean
  imageUrl: string
}
interface IShape {
  sceneFunc: (ctx: Context, shape) => void
}

interface CanvasData {
  objects: IShape[]
}

const Canvas: FC<CanvasProps> = ({ width, height, style, innerRef, erase = false, imageUrl }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const store = useStore()
  const canvasManager = useMemo(() => {
    const manager = new CanvasManager()
    setTimeout(() => {
      store.set(CanvasManagerAtom, manager)
    })
    return manager
  }, [])

  useEffect(() => {
    const layer = canvasManager.initialize(containerRef.current)
    innerRef && (innerRef.current = layer.getNativeCanvasElement())
    return () => {
      canvasManager.destory()
    }
  }, [])
  useEffect(() => {
    canvasManager.setDrawMode(erase ? 'erase' : 'draw')
  }, [erase])
  useEffect(() => {
    if (imageUrl) {
      canvasManager.addImage(imageUrl)
    }
  }, [imageUrl])
  return <div style={{ width, height, ...style }} ref={containerRef}></div>
}

export default Canvas
