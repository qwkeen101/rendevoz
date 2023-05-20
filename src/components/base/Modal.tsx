import { CSSProperties, FC, MouseEventHandler, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactDOM from 'react-dom'
import { css } from '@emotion/css'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'
import { useSetting } from '@/core'
import Icon from './Icon'

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
          overflow: 'hidden'
        },
        ClassName.flexLayout('center', 'center')
      ])}
      onClick={e => {
        e.stopPropagation()
        e.preventDefault()
      }}
      initial={{ background: 'rgba(0,0,0,0)' }}
      animate={{ background: 'rgba(0,0,0,0.2)' }}
      exit={{ background: 'rgba(0,0,0,0)' }}
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
  style,
  zIndex
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
        <div style={{ position: 'fixed', inset: 0, zIndex: zIndex || Zindexes.ModalBackdrop }}>
          <motion.div
            key={2}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'absolute',
              inset: 0,
              backdropFilter: 'blur(4px)'
            }}
            className={ClassName.Background.blurBackground}
          ></motion.div>
          <Backdrop onMouseDown={onClose} key={1}>
            <motion.div
              key={20}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: 'fixed',
                top: 30,
                right: 30
              }}
              onPointerDown={e => {
                onClose()
                e.preventDefault()
                e.stopPropagation()
              }}
            >
              <Icon name="park-close" className={ClassName.circleButton()} size={18} />
            </motion.div>
            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 50, opacity: 0 }}
              role="modal"
              className={css([
                !noStyle && { padding: '16px 24px', borderRadius: '6px', boxShadow: '0 10px 24px rgba(0, 0, 0, 0.18)', overflow: 'hidden' }
              ])}
              style={{
                position: 'relative',
                minWidth,
                minHeight,
                maxHeight,
                maxWidth,
                width,
                height,
                zIndex: Zindexes.Modal,
                margin: 'auto',
                ...style
              }}
              onPointerDown={e => e.stopPropagation()}
              onClick={e => {
                e.stopPropagation()
              }}
              transition={{ stiffness: 200, damping: 20 }}
            >
              {children}
            </motion.div>
          </Backdrop>
        </div>
      )}
    </AnimatePresence>,
    parentElement || document.body
  )
}

export default Modal
