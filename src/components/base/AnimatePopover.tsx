import React, { Dispatch, FC, forwardRef, memo, PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { PopoverProps } from 'react-tiny-popover'
import { Popover } from './popover/Popover'
import useUnmount from '@/hooks/utils/useUnmount'
import { useMergedRef, useUpdateEffect } from '@/hooks'
import { KEY, Zindexes } from '@/consts'
import { LeftTopPosition, Position } from '~/typings'
import { SetStateAction } from 'jotai'
import { createPortal } from 'react-dom'
import isHotkey from 'is-hotkey'

interface PosHelperProps {
  top?: number
  left?: number
  children?: ReactNode
}

export interface AnimatePopoverProps extends Omit<PopoverProps, 'content' | 'isOpen' | 'children'> {
  animate?: boolean
  visible?: boolean
  content: React.ReactNode | ((setVisible: Dispatch<SetStateAction<boolean>>) => ReactNode)
  disableNudge?: boolean
  disableIntersection?: boolean
  onVisiblityChange?: (v: boolean) => void
  innerRef?: RefObject<HTMLElement>
  parentElement?: HTMLElement | null
  backdropFilter?: boolean
  position?: LeftTopPosition
  children?: ReactNode
  contentDraggable?: boolean
  closeOnClickOutside?: boolean
  openOnClick?: boolean
  withClickCover?: boolean
  borderRadius?: number
  openOnClickCapture?: boolean
  duration?: number
  openOnContextMenu?: boolean
  hoverOpen?: boolean
  keepAlign?: boolean
}

const AnimatePopover: FC<PropsWithChildren<AnimatePopoverProps>> = ({
  animate = true,
  content,
  children,
  openOnContextMenu,
  visible,
  borderRadius = 8,
  reposition = false,
  keepAlign = false,
  disableNudge = false,
  position,
  openOnClick = true,
  openOnClickCapture = false,
  parentElement = document.body,
  boundaryElement = document.body,
  boundaryInset = 40,
  innerRef,
  contentDraggable,
  duration = 0.12,
  clickOutsideCapture = true,
  containerStyle: _containerStyle = {
    borderRadius: '8px',
    zIndex: String(Zindexes.PopupMenu)
  },
  onVisiblityChange,
  onClickOutside,
  closeOnClickOutside,
  withClickCover,
  ...rest
}) => {
  const timeoutRef = useRef<NodeJS.Timeout>()
  const [isOpen, setIsOpen] = useState(false)
  const [innerVisible, setInnerVisible] = useState(false)
  const intersectionRef = useRef<HTMLElement>(null)
  const nudgedRef = useRef()
  const mergedRef = useMergedRef(intersectionRef, innerRef)
  useEffect(() => {
    if (visible === undefined) {
      const l = (e: MouseEvent) => {
        setTimeout(() => {
          if (!e.defaultPrevented) {
            setIsOpen(true)
            setInnerVisible(s => !s)
          }
        })
      }
      intersectionRef?.current?.addEventListener('click', l, openOnClickCapture)
      if (openOnContextMenu) {
        intersectionRef?.current?.addEventListener('contextmenu', l)
      }
      return () => {
        intersectionRef.current?.removeEventListener('click', l, openOnClickCapture)
        intersectionRef?.current?.removeEventListener('contextmenu', l)
      }
    }
  }, [])

  useUnmount(() => {
    setIsOpen(false)
    nudgedRef.current = undefined
  })
  const contentHoverRef = useRef(false)
  useEffect(() => {
    // if open
    if (visible) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
        timeoutRef.current = undefined
      }
      setIsOpen(true)
      setInnerVisible(true)
    }
    // if close
    if (!visible) {
      nudgedRef.current = undefined
      setInnerVisible(false)
    }
  }, [visible])

  useUpdateEffect(() => {
    onVisiblityChange?.(isOpen)
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        e.preventDefault()
        e.stopPropagation()
        onClickOutside?.(e)
        timeoutRef.current = setTimeout(() => setIsOpen(false), duration * 1000)
        if (visible === undefined) {
          setInnerVisible(false)
        }
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', keydownHandler, true)
      const containerDockPane = intersectionRef.current?.closest(`[role='tabpane']`)
      if (containerDockPane) {
        const visiblityWatcher = new MutationObserver(cb => {
          cb.forEach(record => {
            if (record.attributeName === 'style') {
              const style = (record.target as HTMLElement).style
              if (style.contentVisibility === 'hidden') {
                setIsOpen(false)
              }
            }
          })
        })
        visiblityWatcher.observe(containerDockPane, {
          attributes: true,
          attributeFilter: ['style']
        })
        return () => {
          document.removeEventListener('keydown', keydownHandler, true)
          visiblityWatcher.disconnect()
        }
      }
    }
    return () => {
      document.removeEventListener('keydown', keydownHandler, true)
    }
  }, [isOpen])

  const handleClickOutside = (e: MouseEvent) => {
    if (withClickCover) {
      return
    }
    if (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'click-cover') {
      return
    }
    if (document.querySelector('[role="click-cover"]')) return
    setTimeout(() => {
      if (e.defaultPrevented) return
      onClickOutside?.(e)
      if (closeOnClickOutside) {
        timeoutRef.current = setTimeout(() => setIsOpen(false), duration * 1000)
      }
      if (visible === undefined) {
        setInnerVisible(false)
      }
    })
  }
  const realParent = parentElement === null || parentElement === undefined ? document.body : parentElement
  const getTransformOrigin = (position: 'left' | 'top' | 'right' | 'bottom' | undefined, align?: 'start' | 'end' | 'center') => {
    // top left
    const origin = {
      x: 0.5,
      y: 0.5
    }
    switch (align) {
      case 'start':
        if (position !== 'top' && position !== 'bottom') {
          origin.y = 0
        } else {
          origin.x = 0
        }
        break
      case 'end':
        if (position !== 'top' && position !== 'bottom') {
          origin.y = 1
        } else {
          if (position !== 'bottom') {
            origin.x = 1
          }
        }
        break
    }
    switch (position) {
      case 'left':
        origin.x = 1
        break
      case 'right':
        origin.x = 0
        break
      case 'top':
        origin.y = 1
        break
      case 'bottom':
        origin.y = 0
        break
    }
    return origin
  }
  const containerStyle = {
    ..._containerStyle,
    borderRadius
  }

  const contentRenderer = ({ nudgedLeft, nudgedTop, position, align }) => {
    const origin = getTransformOrigin(position, align)
    if (!disableNudge) {
      nudgedRef.current = {
        left: nudgedLeft,
        top: nudgedTop
      }
    } else {
      nudgedRef.current = undefined
    }

    const { left, top } = nudgedRef.current || {
      left: undefined,
      top: undefined
    }
    return (
      <AnimatePresence onExitComplete={() => setIsOpen(false)}>
        {innerVisible && (
          <motion.div
            onPointerEnter={() => (contentHoverRef.current = true)}
            onPointerLeave={() => {
              contentHoverRef.current = false
            }}
            drag={contentDraggable}
            dragElastic={0}
            dragMomentum={false}
            initial={{ opacity: 0, visibility: 'hidden' }}
            animate={{ opacity: 1, visibility: 'visible' }}
            exit={{ opacity: 0 }}
            transition={{
              delay: 0.05,
              duration: animate ? duration : 0
            }}
            style={{
              position: 'relative',
              left: left,
              top: top,
              originX: origin.x,
              originY: origin.y,
              borderRadius: containerStyle?.borderRadius,
              display: 'block'
            }}
          >
            {withClickCover &&
              createPortal(
                <div
                  role={'click-cover'}
                  style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    zIndex: Number(containerStyle?.zIndex || '9999') - 1
                  }}
                  onClick={e => {
                    e.stopPropagation()
                    onClickOutside?.(e)
                    if (visible === undefined) {
                      setInnerVisible(false)
                    }
                  }}
                ></div>,
                document.body
              )}

            {React.isValidElement(content) ? content : typeof content === 'function' ? content(setInnerVisible) : null}
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <Popover
      {...rest}
      boundaryElement={boundaryElement}
      boundaryInset={boundaryInset}
      containerStyle={containerStyle}
      parentElement={realParent}
      keepTracking={keepAlign}
      childRect={
        position
          ? {
              left: position.left ?? position.x ?? 0,
              top: position.top ?? position.y ?? 0,
              width: 0,
              height: 0,
              right: position.left ?? position.x ?? 0,
              bottom: position.top ?? position.y ?? 0
            }
          : undefined
      }
      onClickOutside={handleClickOutside}
      clickOutsideCapture={clickOutsideCapture}
      reposition={reposition}
      isOpen={isOpen}
      ref={mergedRef}
      content={props => contentRenderer(props)}
    >
      {children}
    </Popover>
  )
}

export default memo(AnimatePopover)
