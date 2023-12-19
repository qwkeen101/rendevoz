import React, { Dispatch, FC, forwardRef, memo, PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Popover, PopoverProps } from 'react-tiny-popover'
import useUnmount from '@/hooks/utils/useUnmount'
import _ from 'lodash'
import { useMergedRef } from '@/hooks'
import { Colors, Zindexes } from '@/consts'
import { Position } from '~/typings'
import { SetStateAction } from 'jotai'
import { createPortal } from 'react-dom'

interface PosHelperProps {
  top?: number
  left?: number
  children?: ReactNode
}
const PosHelper = forwardRef<HTMLDivElement, PosHelperProps>(({ top, left, children }, ref) => {
  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: top,
        left: left,
        width: 1,
        height: 1
      }}
    >
      {children}
    </div>,
    document.body
  )
})
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
  duration?: number
  hoverOpen?: boolean
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
  duration = 0.16,
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
        setIsOpen(true)
        setInnerVisible(s => !s)
      })
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
    console.log(e)
    let clickOnCover = false
    if (e.target instanceof HTMLElement && e.target.getAttribute('role') === 'click-cover') {
      clickOnCover = true
    }
    // have click cover but not click on cover, return here
    if (!clickOnCover && withClickCover) {
      return
    }
    // click on another popover's cover, return here
    if (clickOnCover && !withClickCover) {
      return
    }
    // if (e.path?.some(i => i instanceof HTMLElement && i.getAttribute('data-disable-close-popover') === 'true')) {
    //   return
    // }

    setTimeout(() => {
      if (e.defaultPrevented) return
      onClickOutside?.(e)
      if (closeOnClickOutside) {
        setTimeout(() => setIsOpen(false), duration * 1000)
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
                      duration
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
                            handleClickOutside(e)
                          }}
                        ></div>,
                        document.body
                      )}

                    {React.isValidElement(content) ? content : typeof content === 'function' ? content(setInnerVisible) : null}
                  </motion.div>
                )}
              </AnimatePresence>
            )
          }}
        >
          <PosHelper left={position.x ?? position.left} top={position.top ?? position.y} />
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
            <AnimatePresence onExitComplete={() => setIsOpen(false)}>
              {innerVisible && (
                <motion.div
                  dragElastic={0}
                  dragMomentum={false}
                  onPointerEnter={() => (contentHoverRef.current = true)}
                  onPointerLeave={e => {
                    contentHoverRef.current = false
                  }}
                  initial={{ opacity: 0, visibility: 'hidden' }}
                  animate={{ opacity: 1, visibility: 'visible' }}
                  exit={{ opacity: 0 }}
                  transition={{
                    delay: 0.05,
                    duration
                  }}
                  drag={contentDraggable}
                  style={{
                    position: 'relative',
                    left: left,
                    top: top,
                    borderRadius: containerStyle.borderRadius,
                    display: 'block',
                    originX: origin.x,
                    originY: origin.y
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
                  {React.isValidElement(content) ? content : typeof content === 'function' ? content(setInnerVisible) : null}
                </motion.div>
              )}
            </AnimatePresence>
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
