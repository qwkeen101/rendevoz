import { memo } from 'react'

const rowSizeBase = {
  width: '100%',
  height: '8px',
  top: '0px',
  left: '0px',
  cursor: 'row-resize'
} as const

const colSizeBase = {
  width: '8px',
  height: '100%',
  top: '0px',
  left: '0px',
  cursor: 'col-resize'
} as const

const edgeBase = {
  width: '16px',
  height: '16px',
  position: 'absolute'
} as const

const styles: Record<Direction, React.CSSProperties> = {
  top: { ...rowSizeBase, top: '-4px' },
  right: { ...colSizeBase, left: undefined, right: '-4px' },
  bottom: { ...rowSizeBase, top: undefined, bottom: '-4px' },
  left: { ...colSizeBase, left: '-4px' },
  topRight: { ...edgeBase, right: '-8px', top: '-8px', cursor: 'ne-resize' },
  bottomRight: { ...edgeBase, right: '-8px', bottom: '-8px', cursor: 'se-resize' },
  bottomLeft: { ...edgeBase, left: '-8px', bottom: '-8px', cursor: 'sw-resize' },
  topLeft: { ...edgeBase, left: '-8px', top: '-8px', cursor: 'nw-resize' }
}

export type Direction = 'top' | 'right' | 'bottom' | 'left' | 'topRight' | 'bottomRight' | 'bottomLeft' | 'topLeft'

type Props = {
  direction: Direction
  onResizeStart: (e: PointerEvent, dir: Direction, cursor?: string) => void
}

const Resizer = memo(({ direction, onResizeStart }: Props) => {
  return (
    <div
      style={{
        pointerEvents: 'inherit',
        position: 'absolute',
        ...styles[direction]
      }}
      onPointerDown={e => {
        e.stopPropagation()
        onResizeStart(e.nativeEvent, direction, styles[direction]?.cursor)
      }}
    />
  )
})

export default Resizer
