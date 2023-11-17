import { CSSProperties, memo, useEffect, useMemo, useRef } from 'react'
import { EdgePosition } from '~/typings'
import { useToggle } from '@/hooks'
import { useAddingEdges } from '@/core/components/whiteboard/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { css } from '@emotion/css'

export const NodeResizer = memo(({ position, nodeId }: { position: EdgePosition; nodeId: number }) => {
  const [visible, toggleVisible] = useToggle(false)
  const [isAddingEdge, setIsAddingEdge] = useAddingEdges()
  const nodeResizerEdgeRef = useRef<HTMLDivElement>(null)
  const getNodeStyle = (): CSSProperties => {
    const left =
      position === 'left'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : position === 'top' || position === 'bottom'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : undefined
    const top =
      position === 'top'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : position === 'left' || position === 'right'
        ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)'
        : undefined
    const right = position === 'right' ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)' : undefined
    const bottom = position === 'bottom' ? 'calc(50% - var(--resizer-size) * var(--zoom-level) / 2)' : undefined
    return {
      left,
      top,
      right,
      bottom
    }
  }
  useEffect(() => {
    if (isAddingEdge.targetNodeId === nodeId) {
      toggleVisible(true)
    } else {
      toggleVisible(false)
    }
  }, [isAddingEdge.targetNodeId])
  const nodeStyle = useMemo(() => getNodeStyle(), [position])
  return (
    <div
      onPointerEnter={() => !isAddingEdge.isAdding && toggleVisible(true)}
      ref={nodeResizerEdgeRef}
      onPointerLeave={() => !isAddingEdge.isAdding && toggleVisible(false)}
      style={{
        '--resizer-size': '16px',
        width: '100%',
        height: '100%',
        '--resizer-bg': 'var(--node-color)',
        pointerEvents: 'inherit'
      }}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onPointerDown={e => {
              e.preventDefault()
              e.stopPropagation()
              setIsAddingEdge({
                isAdding: true,
                sourceNodeId: nodeId,
                sourcePosition: position
              })
            }}
            style={nodeStyle}
            className={resizerNodeClassName}
          ></motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})
const resizerNodeClassName = css({
  width: 'calc(var(--resizer-size) * var(--zoom-level))',
  height: 'calc(var(--resizer-size) * var(--zoom-level))',
  position: 'absolute',
  cursor: 'pointer',
  ':after': {
    content: '""',
    borderRadius: '50%',
    border: '2px solid white',
    boxSizing: 'border-box',
    display: 'block',
    width: 'calc(var(--resizer-size) * var(--zoom-level))',
    height: 'calc(var(--resizer-size) * var(--zoom-level))',
    background: 'var(--resizer-bg)',
    position: 'relative',
    left: 0,
    top: 0
  }
})
