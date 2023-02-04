import Zindexes from '@/consts/zindex'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { createPortal } from 'react-dom'

const useDragIndicator = () => {
  const [indicatorState, setIndicatorState] = useState<
    Partial<{
      visible: boolean
      top: number
      left: number
      width: number
      height: number
      nested?: boolean
    }>
  >()
  const indicatorManager = {
    setIndicatorState
  }

  const renderIndicator = createPortal(
    <div
      role="editor-drag-indicator-overlay"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: Zindexes.Tooltip
      }}
    >
      <motion.div
        initial={{ opacity: 0 }}
        style={{
          maxWidth: indicatorState?.width,
          maxHeight: indicatorState?.height,
          overflow: 'hidden',
          position: 'relative'
        }}
        animate={{
          opacity: indicatorState?.visible ? 0.6 : 0,
          x: indicatorState?.left,
          y: indicatorState?.top,
          height: indicatorState?.height,
          width: indicatorState?.width
        }}
        transition={{
          duration: 0.1,
          bounce: 0
        }}
      >
        {indicatorState?.nested && (
          <div
            style={{
              position: 'absolute',
              width: 16,
              top: 0,
              height: indicatorState.height,
              background: '#8590ae',
              opacity: 0.45,
              borderRadius: 8
            }}
          ></div>
        )}
        <motion.div
          style={{ marginLeft: indicatorState?.nested ? 18 : 0, width: '100%', height: '100%', background: '#8590ae', borderRadius: 8 }}
        ></motion.div>
      </motion.div>
    </div>,
    document.body,
    'editor-drag-indicator-overlay'
  )

  return {
    indicatorManager,
    renderIndicator
  }
}

export default useDragIndicator
