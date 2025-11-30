import { css } from '@emotion/css'
import { Colors } from '../consts'
import { CSSProperties, memo, useRef } from 'react'
import { AnimatePopover, Icon } from '@/components'
import { DragHandlers, motion } from 'framer-motion'
import ColumnMenu from '../elements/table/menu/ColumnMenu'
import RowMenu from '../elements/table/menu/RowMenu'
import { isEqual } from 'lodash'
const EditorTableHandleCommonClazz = css({
  userSelect: 'none',
  transition: 'all 0.15s ease 0s',
  cursor: 'pointer',
  position: 'absolute',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: Colors.Background.Secondary,
  zIndex: 10,
  borderRadius: 4,
  border: Colors.Consts.Border,
  ':hover': {
    background: Colors.Background.Secondary
  }
})
export default memo(
  ({
    onDrag,
    direction,
    visible,
    onDragStart,
    onDragEnd,
    onPointerDown,
    onPointerUp,
    menuOptions
  }: {
    direction: 'top' | 'left'
    visible: boolean
    onDrag?: DragHandlers['onDrag']
    onPointerUp?: VoidFunction
    onPointerDown?: VoidFunction
    onDragStart?: DragHandlers['onDragStart']
    onDragEnd?: DragHandlers['onDragEnd']
    menuOptions?: {
      showHeader: boolean
      isHeader: boolean
      on: VoidFunction
    }
  }) => {
    const style: CSSProperties = {
      color: Colors.Font.SuperTransparent
    }
    const iconPressed = useRef(false)
    if (direction === 'top') {
      style.top = '-8px'
      style.left = 'calc(50% - 13px)'
      style.width = 26
      style.height = 16
      style.padding = '2px 4px'
    }
    if (direction === 'left') {
      style.top = 'calc(50% - 13px)'
      style.left = '-8px'
      style.width = 16
      style.height = 24
      style.padding = '4px 2px'
    }
    const iconRef = useRef<HTMLElement>(null)
    return (
      <AnimatePopover
        content={setV =>
          direction === 'top' ? (
            <ColumnMenu
              on={args => {
                menuOptions?.on(args)
                setV(false)
              }}
              showHeader={menuOptions?.showHeader ?? false}
              isHeader={menuOptions?.isHeader ?? false}
            />
          ) : (
            <RowMenu
              on={args => {
                menuOptions?.on(args)
                setV(false)
              }}
              showHeader={menuOptions?.showHeader ?? false}
              isHeader={menuOptions?.isHeader ?? false}
            />
          )
        }
        positions={direction === 'top' ? ['bottom', 'top'] : ['left', 'right']}
      >
        <motion.div
          role={'drag-handle'}
          onPointerDown={e => {
            e.currentTarget.setAttribute('data-pressed', 'true')
            onPointerDown?.(e)
          }}
          dragElastic={0}
          onDragStart={onDragStart}
          onDrag={(event, info) => {
            onDrag?.(event, info)
          }}
          whileDrag={{
            opacity: 0,
            visibility: 'hidden'
          }}
          onPointerUp={e => {
            e.currentTarget.removeAttribute('data-pressed')
            onPointerUp?.()
          }}
          whileTap={{
            background: Colors.Background.Secondary,
            transition: {
              duration: 0.1
            }
          }}
          initial={{
            opacity: 0,
            background: Colors.Background.Global
          }}
          animate={{
            opacity: visible ? 1 : 0
          }}
          onDragEnd={(e, info) => {
            e.target.removeAttribute('data-pressed')
            onDragEnd?.(e, info)
          }}
          dragTransition={{ min: 0, max: 0 }}
          contentEditable={false}
          dragMomentum={false}
          drag={direction === 'top' ? 'x' : 'y'}
          className={EditorTableHandleCommonClazz}
          style={style}
        >
          <Icon
            ref={iconRef}
            onPointerDown={() => {
              iconPressed.current = false
            }}
            size={16}
            name={'park-drag'}
            style={{
              transformOrigin: 'center',
              transform: direction === 'top' ? 'rotate(90deg)' : undefined
            }}
          />
        </motion.div>
      </AnimatePopover>
    )
  },
  (prevProps, nextProps) =>
    prevProps.direction === nextProps.direction &&
    prevProps.visible === nextProps.visible &&
    prevProps.boundRef === nextProps.boundRef &&
    isEqual(prevProps.menuOptions, nextProps.menuOptions)
)
