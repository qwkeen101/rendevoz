import { memo, useMemo } from 'react'
import { useWhiteboardState } from '../hooks'
import NodeLayer from './NodeLayer'
import EdgeLayer from './EdgeLayer'

const Canvas = memo(() => {
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
      >
        <EdgeLayer />
        <NodeLayer />
      </div>
    </div>
  )
})

export default Canvas
