import { CSSProperties, FC, MouseEventHandler, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactDOM from 'react-dom'
import Zindexes from '@/consts/zindex'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'
import { Colors } from '@/consts'
import { useMemoizedFn } from '@/hooks'

interface ModalProps {
  visible: boolean
  minWidth?: number
  minHeight?: number
  maxWidth?: number
  maxHeight?: number
  width?: number | string
  height?: number | string
  onClose: () => void
  onClick?: MouseEventHandler
  children: React.ReactNode
  parentElement?: HTMLElement | null
  noStyle?: boolean
  style?: CSSProperties
  zIndex?: number
  notUnmount?: boolean
  disableAnimation?: boolean
  hideBackground?: boolean
}

const Modal: FC<ModalProps> = ({
  visible,
  onClose,
  children,
  minWidth,
  minHeight,
  maxHeight,
  maxWidth,
  width,
  height,
  parentElement,
  style,
  zIndex,
  notUnmount,
  disableAnimation,
  hideBackground
}) => {
  const keyDownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (isHotkey(KEY.Escape, e) && visible) {
      if (e.defaultPrevented) return
      e.preventDefault()
      onClose?.()
    }
  })
  useEffect(() => {
    if (visible) {
      Global.values.keydownHandlers.unshift(keyDownHandler)
      return () => {
        Global.values.keydownHandlers = Global.values.keydownHandlers.filter(i => i !== keyDownHandler)
      }
    }
  }, [visible])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [visible])
  const renderInner = () => {
    if (!notUnmount) {
      if (!visible) return null
    }
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: visible ? 1 : 0
        }}
        exit={{ opacity: 0 }}
        role='modal-container'
        className={'fixed inset-0 overflow-hidden flex items-center justify-center'}
        transition={{ duration: disableAnimation ? 0 : 0.15 }}
        style={{
          zIndex: visible ? zIndex || Zindexes.ModalBackdrop : -1,
          pointerEvents: visible ? 'auto' : 'none'
        }}
      >
        <div
          onPointerDown={e => {
            if (e.target === e.currentTarget) {
              onClose?.()
            }
          }}
          className={'absolute inset-0'}
          style={{
            background: 'rgba(15,15,15,0.6)'
          }}
        ></div>
        <div
          style={{
            position: 'relative',
            backdropFilter: hideBackground ? undefined : 'blur(10px)',
            background: hideBackground ? undefined : Colors.Background.Popover,
            boxShadow: hideBackground
              ? undefined
              : 'rgba(15, 15, 15, 0.05) 0px 0px 0px 1px, rgba(15, 15, 15, 0.1) 0px 5px 10px, rgba(15, 15, 15, 0.2) 0px 15px 40px',
            minWidth,
            minHeight,
            maxHeight,
            maxWidth,
            width,
            height,
            borderRadius: 12,
            ...style
          }}
        >
          {children}
        </div>
      </motion.div>
    )
  }
  return ReactDOM.createPortal(<AnimatePresence>{renderInner()}</AnimatePresence>, parentElement || document.body)
}

export default Modal
