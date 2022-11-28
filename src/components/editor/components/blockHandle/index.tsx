import { Noop } from '@/common/types'
import { Icon } from '@/components'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, memo } from 'react'

type BlockHandleProps = {
  left?: number
  top?: number
  targetHeight?: number
  targetId?: number
}

type IBlockHandle = FC<
  BlockHandleProps & {
    visible: boolean
    onMouseDown: Noop
    onClick: Noop
    onDragClick: Noop
    onAddClick: React.MouseEventHandler
  }
>
const BlockHandle: IBlockHandle = ({ left, top, targetHeight, visible, onMouseDown, onClick, onAddClick, onDragClick }) => {
  return (
    <AnimatePresence>
      {targetHeight && visible && (
        <motion.div
          key={top}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onMouseDown}
          onClick={onClick}
          style={{
            position: 'fixed',
            top: top,
            left: left,
            height: targetHeight,
            zIndex: 99
          }}
        >
          <div
            onClick={onAddClick}
            className={css({
              transition: 'all 0.2s ease',
              ':hover': { background: 'rgba(0,0,0,0.06)' },
              padding: 2,
              borderRadius: 4
            })}
            style={{ position: 'absolute', left: -40, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, cursor: 'pointer' }}
          >
            <Icon size={16} name="park-plus" fill="#8590ae" />
          </div>
          <div
            onMouseDown={onDragClick}
            className={css({
              transition: 'all 0.2s ease',
              ':hover': { background: 'rgba(0,0,0,0.06)' },
              padding: 2,
              borderRadius: 4
            })}
            style={{ position: 'absolute', left: -20, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, cursor: 'grab' }}
          >
            <Icon size={16} name="park-drag" fill="#8590ae" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(BlockHandle)
