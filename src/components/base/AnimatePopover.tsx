import React, { Dispatch, FC, memo, PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Popover, PopoverProps } from 'react-tiny-popover'
import useUnmount from '@/hooks/utils/useUnmount'
import _ from 'lodash'
import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { Zindexes } from '@/consts'
import { Position } from '~/typings'
import { PosHelper } from '../contextMenu'
import { SetStateAction } from 'jotai'
import { createPortal } from 'react-dom'
import zindex from '@/consts/zindex'

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
  position?: Position
  children?: ReactNode
  contentDraggable?: boolean
  closeOnClickOutside?: boolean
  withClickCover?: boolean
  borderRadius?: number
}

const AnimatePopover: FC<PropsWithChildren<AnimatePopoverProps>> = ({
  animate = true,
  content,
  children,
  visible,
  borderRadius = 8,
  reposition = false,
  disableNudge = false,
  position,
  parentElement = document.body,
  boundaryElement = document.body,
  boundaryInset = 40,
  innerRef,
  contentDraggable,
  clickOutsideCapture = true,
  containerStyle: _containerStyle = {
    borderRadius: '8px',
    zIndex: String(Zindexes.PopupMenu)
  },
  onVisiblityChange,
  backdropFilter = true,
  onClickOutside,
  closeOnClickOutside,
  withClickCover,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [innerVisible, setInnerVisible] = useState(false)
  const [hasPosHelperPopoverVisible, setHasPosHelperPopoverVisible] = useState(false)
  const intersectionRef = useRef<HTMLElement>(null)

  const popoverRef = useRef(null)
  const nudgedRef = useRef()
  const mergedRef = useMergedRef(intersectionRef, innerRef)
  useEffect(() => {
    if (visible === undefined) {
      intersectionRef?.current?.addEventListener('click', () => {
        setIsOpen(s => true)
        setInnerVisible(s => !s)
      })
    }
  }, [])
  useUnmount(() => {
    setIsOpen(false)
    nudgedRef.current = undefined
  })
  useEffect(() => {
    // if open
    if (visible) {
      if (position) {
        setHasPosHelperPopoverVisible(true)
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

  useEffect(() => {
    onVisiblityChange?.(isOpen)
    if (isOpen) {
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
          visiblityWatcher.disconnect()
        }
      }
    }
    if (position) {
      if (isOpen === false) {
        setHasPosHelperPopoverVisible(false)
      }
    }
  }, [isOpen])
  const handleClickOutside = (e: MouseEvent) => {
    let clickOnCover = false
    if (withClickCover) {
      if (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'click-cover') {
        clickOnCover = true
      } else {
        return
      }
    }
    if (!clickOnCover && document.body.querySelector('[role="click-cover"]')) {
      if (isOpen) {
        return
      }
    }
    if (e.path?.some(i => i instanceof HTMLElement && i.getAttribute('data-disable-close-popover') === 'true')) {
      return
    }

    setTimeout(() => {
      if (e.defaultPrevented) return
      onClickOutside?.(e)
      if (closeOnClickOutside) {
        setTimeout(() => setIsOpen(false), 300)
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
          origin.x = 1
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
  if (animate) {
    return position ? (
      hasPosHelperPopoverVisible && (
        <Popover
          clickOutsideCapture={clickOutsideCapture}
          {...rest}
          containerStyle={containerStyle}
          parentElement={realParent}
          onClickOutside={handleClickOutside}
          reposition={reposition}
          isOpen={isOpen}
          boundaryElement={boundaryElement}
          boundaryInset={boundaryInset}
          ref={mergedRef}
          content={({ nudgedLeft, nudgedTop, position, align }) => {
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
              <motion.div
                drag={contentDraggable}
                dragElastic={0}
                dragMomentum={false}
                style={{
                  position: 'relative',
                  left: left,
                  top: top,
                  borderRadius: containerStyle?.borderRadius,
                  // overflow: 'hidden',
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
                        handleClickOutside(e)
                      }}
                    ></div>,
                    document.body
                  )}
                <AnimatePresence onExitComplete={() => setIsOpen(false)}>
                  {innerVisible && (
                    <>
                      {backdropFilter && (
                        <motion.div
                          key={1}
                          initial={{ opacity: 0.6, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: -1,
                            borderRadius: 'inherit',
                            originX: origin.x,
                            originY: origin.y
                          }}
                          className={ClassName.Background.blurBackground}
                        ></motion.div>
                      )}
                      <motion.div
                        key={2}
                        style={{
                          originX: origin.x,
                          originY: origin.y
                        }}
                        initial={{ opacity: 0.6, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        {React.isValidElement(content) ? content : typeof content === 'function' ? content(setInnerVisible) : null}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          }}
        >
          <PosHelper left={position.x || position.left} top={position.top || position.y} />
        </Popover>
      )
    ) : (
      <Popover
        {...rest}
        boundaryElement={boundaryElement}
        boundaryInset={boundaryInset}
        containerStyle={containerStyle}
        parentElement={realParent}
        onClickOutside={handleClickOutside}
        clickOutsideCapture={clickOutsideCapture}
        reposition={reposition}
        isOpen={isOpen}
        ref={mergedRef}
        content={({ nudgedLeft, nudgedTop, position, align }) => {
          const origin = getTransformOrigin(position, align)
          if ((!nudgedRef.current || _.isEqual(nudgedRef.current, { left: 0, top: 0 })) && !disableNudge) {
            nudgedRef.current = {
              left: nudgedLeft,
              top: nudgedTop
            }
          }

          const { left, top } = nudgedRef.current || {
            left: undefined,
            top: undefined
          }
          return (
            <motion.div
              dragElastic={0}
              dragMomentum={false}
              drag={contentDraggable}
              style={{
                position: 'relative',
                left: left,
                top: top,
                borderRadius: containerStyle.borderRadius,
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
                      handleClickOutside(e)
                    }}
                  ></div>,
                  document.body
                )}
              <AnimatePresence onExitComplete={() => setIsOpen(false)}>
                {innerVisible && (
                  <>
                    {backdropFilter && (
                      <motion.div
                        key={1}
                        initial={{ opacity: 0.6, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'inherit',
                          zIndex: -1,
                          originX: origin.x,
                          originY: origin.y
                        }}
                        className={ClassName.Background.blurBackground}
                      ></motion.div>
                    )}
                    <motion.div
                      key={2}
                      initial={{ opacity: 0.6, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      style={{
                        originX: origin.x,
                        originY: origin.y
                      }}
                    >
                      {React.isValidElement(content) ? content : typeof content === 'function' ? content(setInnerVisible) : null}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </motion.div>
          )
        }}
      >
        {children}
      </Popover>
    )
  }
  return (
    <Popover
      ref={popoverRef}
      isOpen={visible}
      content={content}
      boundaryInset={rest.boundaryInset}
      parentElement={realParent}
      reposition={false}
    >
      {children}
    </Popover>
  )
}

export default memo(AnimatePopover)
