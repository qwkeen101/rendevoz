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
}

const AnimatePopover: FC<PropsWithChildren<AnimatePopoverProps>> = ({
  animate = true,
  content,
  children,
  visible,
  reposition = false,
  disableNudge = false,
  position,
  parentElement = document.body,
  boundaryElement = document.body,
  boundaryInset = 40,
  innerRef,
  contentDraggable,
  clickOutsideCapture = true,
  containerStyle = {
    borderRadius: '8px',
    zIndex: String(Zindexes.PopupMenu)
  },
  onVisiblityChange,
  backdropFilter = true,
  onClickOutside,
  closeOnClickOutside,
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
          content={({ nudgedLeft, nudgedTop, position }) => {
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
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: 'block'
                }}
              >
                <AnimatePresence onExitComplete={() => setIsOpen(false)}>
                  {innerVisible && (
                    <>
                      {backdropFilter && (
                        <motion.div
                          key={1}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          style={{
                            position: 'absolute',
                            inset: 0,
                            zIndex: -1,
                            borderRadius: 'inherit'
                          }}
                          className={ClassName.Background.blurBackground}
                        ></motion.div>
                      )}
                      <motion.div key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
        containerStyle={{ borderRadius: '8px', ...containerStyle }}
        parentElement={realParent}
        onClickOutside={handleClickOutside}
        clickOutsideCapture={clickOutsideCapture}
        reposition={reposition}
        isOpen={isOpen}
        ref={mergedRef}
        content={({ nudgedLeft, nudgedTop }) => {
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
                borderRadius: 'inherit',
                display: 'block'
              }}
            >
              <AnimatePresence onExitComplete={() => setIsOpen(false)}>
                {innerVisible && (
                  <>
                    {backdropFilter && (
                      <motion.div
                        key={1}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{
                          position: 'absolute',
                          inset: 0,
                          borderRadius: 'inherit',
                          zIndex: -1
                        }}
                        className={ClassName.Background.blurBackground}
                      ></motion.div>
                    )}
                    <motion.div key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
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
