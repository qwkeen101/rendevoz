import { CSSProperties, FC, MouseEventHandler, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ReactDOM from 'react-dom'
import { css } from '@emotion/css'
import Zindexes from '@/consts/zindex'
import ClassName from '@/styles/classNames'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts/key'
import Icon from './Icon'
import { Colors } from '@/consts'
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'

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
  showClose?: boolean
  notUnmount?: boolean
  disableAnimation?: boolean
  enableClickEvent?: boolean
  hideBackground?: boolean
}
const Backdrop = ({ children, onMouseDown, disableAnimation, enableClickEvent }) => {
  const darkMode = useSelectGlobalAtomValue(SettingAtom, s => s.general.darkMode)
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
        if (!enableClickEvent) {
          e.stopPropagation()
          e.preventDefault()
        }
      }}
      initial={{ background: 'rgba(15, 15, 15, 0)' }}
      animate={{ background: darkMode ? 'rgba(15, 15, 15, 0.8)' : 'rgba(15, 15, 15, 0.4)' }}
      exit={{ background: 'rgba(15, 15, 15, 0)' }}
      transition={{ duration: disableAnimation ? 0 : 0.2 }}
      onPointerDown={e => {
        if (e.target === e.currentTarget) {
          onMouseDown?.()
        }
      }}
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
  style,
  zIndex,
  showClose = false,
  notUnmount,
  disableAnimation,
  enableClickEvent,
  hideBackground
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
    notUnmount ? (
      <motion.div
        animate={{
          opacity: visible ? 1 : 0
        }}
        role="modal-container"
        transition={{ duration: disableAnimation ? 0 : 0.2 }}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: visible ? zIndex || Zindexes.ModalBackdrop : -1,
          // opacity: visible ? 1 : 0,
          pointerEvents: visible ? 'auto' : 'none'
          // transition: 'opacity 0.3s ease'
        }}
      >
        <motion.div
          key={2}
          initial={{ opacity: 0 }}
          animate={{ opacity: visible ? 1 : 0 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'absolute',
            inset: 0,
            backdropFilter: 'blur(4px)'
          }}
          transition={{ duration: disableAnimation ? 0 : 0.2 }}
        ></motion.div>

        <Backdrop onMouseDown={onClose} enableClickEvent={enableClickEvent} key={1}>
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: visible ? 1 : 0 }}
            exit={{ y: 50, opacity: 0 }}
            role={enableClickEvent ? undefined : 'modal'}
            style={{
              position: 'relative',
              background: hideBackground ? undefined : Colors.Background.Popover,
              boxShadow: hideBackground ? undefined : Colors.Background.BoxShadow,
              minWidth,
              minHeight,
              maxHeight,
              maxWidth,
              width,
              height,
              zIndex: Zindexes.Modal,
              margin: 'auto',
              borderRadius: 8,
              ...style
            }}
            onPointerDown={e => {
              if (!enableClickEvent) {
                e.stopPropagation()
              }
            }}
            onClick={e => {
              if (!enableClickEvent) {
                e.stopPropagation()
              }
            }}
            transition={{ stiffness: 200, damping: 20, duration: disableAnimation ? 0 : 0.2 }}
          >
            {showClose && (
              <motion.div
                key={20}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  zIndex: Number.MAX_SAFE_INTEGER
                }}
                onPointerDown={e => {
                  onClose()
                  if (!enableClickEvent) {
                    e.preventDefault()
                    e.stopPropagation()
                  }
                }}
              >
                <Icon name="park-close" className={ClassName.circleButton()} size={18} />
              </motion.div>
            )}
            {children}
          </motion.div>
        </Backdrop>
      </motion.div>
    ) : (
      <AnimatePresence>
        {visible && (
          <div
            role="modal-container"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: zIndex || Zindexes.ModalBackdrop
            }}
          >
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
            ></motion.div>

            <Backdrop onMouseDown={onClose} key={1} enableClickEvent={enableClickEvent}>
              <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 50, opacity: 0 }}
                role={enableClickEvent ? undefined : 'modal'}
                style={{
                  position: 'relative',
                  background: hideBackground ? undefined : Colors.Background.Popover,
                  boxShadow: hideBackground ? undefined : Colors.Background.BoxShadow,
                  minWidth,
                  minHeight,
                  maxHeight,
                  maxWidth,
                  width,
                  height,
                  borderRadius: 8,
                  zIndex: Zindexes.Modal,
                  margin: 'auto',
                  ...style
                }}
                onPointerDown={e => {
                  if (!enableClickEvent) {
                    e.stopPropagation()
                  }
                }}
                onClick={e => {
                  if (!enableClickEvent) {
                    e.stopPropagation()
                  }
                }}
                transition={{ stiffness: 200, damping: 20 }}
              >
                {showClose && (
                  <motion.div
                    key={20}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      zIndex: Number.MAX_SAFE_INTEGER
                    }}
                    onPointerDown={e => {
                      onClose()
                      if (!enableClickEvent) {
                        e.stopPropagation()
                        e.preventDefault()
                      }
                    }}
                  >
                    <Icon name="park-close" className={ClassName.circleButton()} size={18} />
                  </motion.div>
                )}
                {children}
              </motion.div>
            </Backdrop>
          </div>
        )}
      </AnimatePresence>
    ),
    parentElement || document.body
  )
}

export default Modal
