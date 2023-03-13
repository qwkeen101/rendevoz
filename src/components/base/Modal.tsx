import { CSSProperties, FC, MouseEventHandler, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactDOM from 'react-dom'
import { css } from '@emotion/css'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'

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
}
const Backdrop = ({ children, onMouseDown }) => {
  return (
    <motion.div
      role="backdrop"
      className={css([
        {
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
          zIndex: Zindexes.ModalBackdrop,
          background: 'rgba(0,0,0,0.2)'
        },
        ClassName.flexLayout('center', 'center')
      ])}
      onClick={e => e.stopPropagation()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onPointerDown={onMouseDown}
    >
      {children}
    </motion.div>
  )
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
  noStyle,
  style
}) => {
  useEffect(() => {
    const keyDownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e) && visible) {
        onClose?.()
      }
    }
    document.addEventListener('keydown', keyDownHandler)
    return () => {
      document.removeEventListener('keydown', keyDownHandler)
    }
  }, [onClose, visible])

  useEffect(() => {
    if (visible) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = 'unset'
      }
    }
  }, [visible])
  return ReactDOM.createPortal(
    <AnimatePresence>
      {visible && (
        <Backdrop onMouseDown={onClose}>
          <motion.div
            role="modal"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{ minWidth, minHeight, maxHeight, maxWidth, width, height, zIndex: Zindexes.Modal, margin: 'auto', ...style }}
            className={css([
              !noStyle && { padding: '16px 24px', borderRadius: '6px', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)', overflow: 'hidden' },
              !noStyle && ClassName.Background.blurBackground
            ])}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => {
              e.stopPropagation()
            }}
            transition={{ stiffness: 200, damping: 20 }}
          >
            {children}
          </motion.div>
        </Backdrop>
      )}
    </AnimatePresence>,
    parentElement || document.body
  )
}

export default Modal
