import { memo } from 'react'

type Props = {
  x: number
  y: number
  onPointerDown?: (e: React.PointerEvent<SVGCircleElement>) => void
}

const EdgeHandle = memo(({ x, y, onPointerDown }: Props) => {
  return (
    <circle
      cx={x}
      cy={y}
      r={5}
      onPointerDown={onPointerDown}
      fill="#fff"
      stroke="#0ea5e9"
      strokeWidth={2}
      style={{
        cursor: 'crosshair',
        pointerEvents: 'auto',
        filter: 'drop-shadow(0 2px 4px rgba(14,165,233,0.3))'
      }}
    />
  )
})

export default EdgeHandle
