import { memo, RefObject, useMemo } from 'react'
import { useWhiteboardState } from '../hooks'
import NodeLayer from './NodeLayer'
import EdgeLayer from './EdgeLayer'

type CanvasProps = {
  transformRef?: RefObject<HTMLDivElement>
}

const Canvas = memo(({ transformRef }: CanvasProps) => {
  const { lastViewport } = useWhiteboardState()
  const transformStyle = useMemo(() => {
    const t = lastViewport || { x: 0, y: 0, scale: 1 }
    return {
      transform: `translate(${t.x}px, ${t.y}px) scale(${t.scale})`,
      transformOrigin: '0 0'
    }
  }, [lastViewport])

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflow: 'hidden'
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          ...transformStyle
        }}
        ref={transformRef}
      >
        <EdgeLayer />
        <NodeLayer />
      </div>
    </div>
  )
})

export default Canvas
