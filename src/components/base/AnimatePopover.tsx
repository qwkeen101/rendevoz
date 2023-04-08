import { FC, memo, PropsWithChildren, ReactNode, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Popover, PopoverProps } from 'react-tiny-popover'
import useUnmount from '@/hooks/utils/useUnmount'
import _ from 'lodash'
import { useIntersection } from 'react-use'
import { useMergedRef } from '@/hooks'
import ClassName from '@/styles/classNames'
import { Zindexes } from '@/consts'
import { Position } from '~/typings'
import { PosHelper } from '../contextMenu'
export interface AnimatePopoverProps extends Omit<PopoverProps, 'content' | 'isOpen' | 'children'> {
  animate?: boolean
  visible?: boolean
  content: React.ReactNode
  disableNudge?: boolean
  disableIntersection?: boolean
  innerRef?: RefObject<HTMLElement>
  parentElement?: HTMLElement | null
  backdropFilter?: boolean
  position?: Position
  children?: ReactNode
}

const AnimatePopover: FC<PropsWithChildren<AnimatePopoverProps>> = ({
  animate = true,
  content,
  children,
  visible,
  disableIntersection,
  reposition = false,
  disableNudge = false,
  position,
  parentElement = document.body,
  innerRef,
  containerStyle = {
    borderRadius: '8px',
    zIndex: String(Zindexes.PopupMenu)
  },
  backdropFilter = true,
  onClickOutside,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [innerVisible, setInnerVisible] = useState(false)
  const [hasPosHelperPopoverVisible, setHasPosHelperPopoverVisible] = useState(false)
  const intersectionRef = useRef<HTMLElement>(null)
  const intersection = useIntersection(intersectionRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1
  })

  const popoverRef = useRef(null)
  const nudgedRef = useRef()
  const mergedRef = useMergedRef(intersectionRef, innerRef)
  useEffect(() => {
    if (visible === undefined) {
      intersectionRef?.current?.addEventListener('click', () => {
        setIsOpen(true)
        setInnerVisible(true)
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
    onClickOutside?.(e)
    if (visible === undefined) {
      setInnerVisible(false)
    }
  }
  const realParent = parentElement === null || parentElement === undefined ? document.body : parentElement

  if (animate) {
    return position ? (
      hasPosHelperPopoverVisible && (
        <Popover
          {...rest}
          containerStyle={containerStyle}
          parentElement={realParent}
          onClickOutside={handleClickOutside}
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

            const { left, top } = nudgedRef.current || { left: undefined, top: undefined }
            return (
              <div
                style={{
                  position: 'relative',
                  left: left,
                  top: top,
                  borderRadius: 8,
                  overflow: 'hidden',
                  display: intersection?.isIntersecting || disableIntersection ? 'block' : 'none'
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
                          style={{ position: 'absolute', inset: 0, zIndex: -1, borderRadius: 'inherit' }}
                          className={ClassName.Background.blurBackground}
                        ></motion.div>
                      )}
                      <motion.div key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                        {content}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>
            )
          }}
        >
          <PosHelper left={position.x || position.left} top={position.top || position.y} />
        </Popover>
      )
    ) : (
      <Popover
        {...rest}
        containerStyle={{ borderRadius: '8px', ...containerStyle }}
        parentElement={realParent}
        onClickOutside={handleClickOutside}
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

          const { left, top } = nudgedRef.current || { left: undefined, top: undefined }
          return (
            <div
              style={{
                position: 'relative',
                left: left,
                top: top,
                borderRadius: 'inherit',
                display: intersection?.isIntersecting || disableIntersection ? 'block' : 'none'
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
                        style={{ position: 'absolute', inset: 0, borderRadius: 'inherit', zIndex: -1 }}
                        className={ClassName.Background.blurBackground}
                      ></motion.div>
                    )}
                    <motion.div key={2} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      {content}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
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
