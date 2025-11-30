import { memo, useEffect, useRef, useState } from 'react'
import Resizer, { Direction } from './Resizer'

type Props = {
  x: number
  y: number
  width: number
  height: number
  children: React.ReactNode
  onResize?: (rect: { width: number; height: number }) => void
  onResizeStart?: () => void
  onResizeEnd?: (rect: { width: number; height: number }) => void
}

const ResizableNode = memo(({ x, y, width, height, children, onResize, onResizeStart, onResizeEnd }: Props) => {
  const ref = useRef<HTMLDivElement>(null)
  const [resizing, setResizing] = useState(false)
  const startRef = useRef<{ w: number; h: number; clientX: number; clientY: number; dir: Direction }>()

  const handleResizeStart = (e: PointerEvent, dir: Direction) => {
    startRef.current = { w: width, h: height, clientX: e.clientX, clientY: e.clientY, dir }
    setResizing(true)
    onResizeStart?.()
  }

  useEffect(() => {
    if (!resizing || !startRef.current) return
    const handleMove = (e: PointerEvent) => {
      const { w, h, clientX, clientY, dir } = startRef.current!
      let deltaX = e.clientX - clientX
      let deltaY = e.clientY - clientY
      let nextW = w
      let nextH = h
      if (dir.includes('right')) nextW = Math.max(40, w + deltaX)
      if (dir.includes('left')) nextW = Math.max(40, w - deltaX)
      if (dir.includes('bottom')) nextH = Math.max(40, h + deltaY)
      if (dir.includes('top')) nextH = Math.max(40, h - deltaY)
      onResize?.({ width: nextW, height: nextH })
    }
    const handleUp = () => {
      setResizing(false)
      if (startRef.current) {
        onResizeEnd?.({ width, height })
      }
      startRef.current = undefined
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
    window.addEventListener('pointermove', handleMove)
    window.addEventListener('pointerup', handleUp)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      window.removeEventListener('pointerup', handleUp)
    }
  }, [resizing, onResize, onResizeEnd, width, height])

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height
      }}
    >
      {children}
      <Resizer direction="topLeft" onResizeStart={handleResizeStart} />
      <Resizer direction="topRight" onResizeStart={handleResizeStart} />
      <Resizer direction="bottomLeft" onResizeStart={handleResizeStart} />
      <Resizer direction="bottomRight" onResizeStart={handleResizeStart} />
      <Resizer direction="top" onResizeStart={handleResizeStart} />
      <Resizer direction="bottom" onResizeStart={handleResizeStart} />
      <Resizer direction="left" onResizeStart={handleResizeStart} />
      <Resizer direction="right" onResizeStart={handleResizeStart} />
    </div>
  )
})

export default ResizableNode
