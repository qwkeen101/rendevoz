import { Noop } from '@/common/types'
import { Icon, Tooltip } from '@/components'
import { useGlobalIsDragging } from '@/components/globalDragOverlay'
import { css } from '@emotion/css'
import { AnimatePresence, motion } from 'framer-motion'
import { FC, memo, MouseEventHandler, useEffect, useLayoutEffect, useRef, useState } from 'react'

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
    onDragClick: MouseEventHandler
    onMenuClick: MouseEventHandler
    onAddClick: MouseEventHandler
  }
>
const BlockHandle: IBlockHandle = ({ left, top, targetHeight, visible, onMouseDown, onClick, onAddClick, onDragClick, onMenuClick }) => {
  const [innerVisible, setInnerVisible] = useState(false)
  const [globalDragging] = useGlobalIsDragging()

  useLayoutEffect(() => {
    if (globalDragging) {
      setInnerVisible(false)
    }
  }, [globalDragging])
  const isInside = useRef(false)
  useEffect(() => {
    if (visible) {
      setInnerVisible(true)
    }
    // leave block
    if (!visible) {
      if (isInside.current) {
        return
      } else {
        setInnerVisible(false)
      }
    }
  }, [visible])
  const AddTooltip = (
    <div
      className={css({
        fontSize: '0.8rem',
        fontWeight: 600
      })}
    >
      <span style={{ color: 'white' }}>Click </span>
      <span style={{ color: 'grey' }}>to add a block below</span>
    </div>
  )
  const DragTooltip = (
    <div
      className={css({
        fontSize: '0.8rem',
        fontWeight: 600,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      })}
    >
      <div>
        <span style={{ color: 'white' }}>Drag </span>
        <span style={{ color: 'grey' }}>to move</span>
      </div>
      <div>
        <span style={{ color: 'white' }}>Click </span>
        <span style={{ color: 'grey' }}>to open menu</span>
      </div>
    </div>
  )
  return (
    <AnimatePresence>
      {targetHeight && innerVisible && (
        <motion.div
          key={top}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={onMouseDown}
          onMouseEnter={() => {
            isInside.current = true
          }}
          onMouseLeave={() => {
            isInside.current = false
            if (visible === false) {
              setInnerVisible(false)
            }
          }}
          onClick={onClick}
          style={{
            position: 'fixed',
            top: top,
            left: left,
            height: targetHeight,
            zIndex: 99
          }}
        >
          <Tooltip style={{ background: 'rgba(0,0,0,0.8)' }} position="top" content={AddTooltip}>
            <div
              onClick={e => {
                onAddClick?.(e)
                setInnerVisible(false)
              }}
              className={css({
                transition: 'all 0.2s ease',
                ':hover': { background: 'rgba(0,0,0,0.06)' },
                padding: 2,
                borderRadius: 4
              })}
              style={{
                position: 'absolute',
                left: -40,
                top: '50%',
                transform: 'translateY(-50%)',
                width: 20,
                height: 20,
                cursor: 'pointer'
              }}
            >
              <Icon size={16} name="park-plus" fill="#8590ae" />
            </div>
          </Tooltip>
          <Tooltip style={{ background: 'rgba(0,0,0,0.8)', transform: 'translate3d(-50%, 15px ,0)' }} position="top" content={DragTooltip}>
            <div
              onMouseDown={e => {
                onDragClick?.(e)
              }}
              onMouseUp={e => {
                onMenuClick?.(e)
              }}
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
          </Tooltip>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default memo(BlockHandle)
