import { memo } from 'react'

type Props = {
  x: number
  y: number
  onPointerDown?: (e: React.PointerEvent<HTMLDivElement>) => void
}

const EdgeHandle = memo(({ x, y, onPointerDown }: Props) => {
  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        position: 'absolute',
        width: 10,
        height: 10,
        borderRadius: 999,
        background: '#fff',
        border: '2px solid #0ea5e9',
        boxShadow: '0 2px 6px rgba(14,165,233,0.3)',
        transform: `translate(${x - 5}px, ${y - 5}px)`,
        pointerEvents: 'auto',
        cursor: 'crosshair'
      }}
    />
  )
})

export default EdgeHandle
