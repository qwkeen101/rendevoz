import { FC, memo, PropsWithChildren, RefObject, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Popover, PopoverProps } from 'react-tiny-popover'
import useUnmount from '@/hooks/utils/useUnmount'
import _ from 'lodash'
import { useIntersection } from 'react-use'
import { useMergedRef } from '@/hooks'
interface AnimatePopoverProps extends Omit<PopoverProps, 'content' | 'isOpen'> {
  animate?: boolean
  visible: boolean
  content: React.ReactNode
  disableNudge?: boolean
  disableIntersection?: boolean
  innerRef?: RefObject<HTMLElement>
}

const AnimatePopover: FC<PropsWithChildren<AnimatePopoverProps>> = ({
  animate = true,
  content,
  children,
  visible,
  disableIntersection,
  reposition = false,
  disableNudge = false,
  innerRef,
  ...rest
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const intersectionRef = useRef(null)
  const intersection = useIntersection(intersectionRef, {
    root: null,
    rootMargin: '0px',
    threshold: 1
  })

  const popoverRef = useRef(null)
  const nudgedRef = useRef()
  const mergedRef = useMergedRef(intersectionRef, innerRef)
  useUnmount(() => {
    setIsOpen(false)
    nudgedRef.current = undefined
  })
  useEffect(() => {
    // if open
    if (visible) {
      setIsOpen(true)
    }
    // if close
    if (!visible) {
      nudgedRef.current = undefined
    }
  }, [visible])
  if (animate) {
    return (
      <Popover
        {...rest}
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
                display: intersection?.isIntersecting || disableIntersection ? 'block' : 'none'
              }}
            >
              <AnimatePresence onExitComplete={() => setIsOpen(false)}>
                {visible && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {content}
                  </motion.div>
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
    <Popover ref={popoverRef} isOpen={visible} content={content} boundaryInset={rest.boundaryInset} reposition={false}>
      {children}
    </Popover>
  )
}

export default memo(AnimatePopover)
