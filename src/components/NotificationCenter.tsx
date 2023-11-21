import Zindexes from '@/consts/zindex'
import { useToaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { css } from '@emotion/css'
import { Icon } from '.'
import Colors from '@/consts/colors'
import { useEffect, useRef, useState } from 'react'
import { throttle } from 'lodash'

const Notification = () => {
  const { toasts, handlers } = useToaster({
    duration: 4000
  })
  const [isIn, setIsIn] = useState(false)
  const { startPause, endPause, calculateOffset, updateHeight } = handlers
  const containerRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (isIn) {
      startPause()
      const throttledCheck = throttle((e: PointerEvent) => {
        if (!containerRef.current?.contains(e.target) && !(e.target as HTMLElement).closest(`[role='object-popover-panel']`)) {
          setIsIn(false)
        }
      }, 100)
      document.addEventListener('pointermove', throttledCheck)
      return () => {
        document.removeEventListener('pointermove', throttledCheck)
      }
    } else {
      endPause()
    }
  }, [isIn])
  return (
    <motion.div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 60,
        right: 60,
        zIndex: Zindexes.Notification,
        fontSize: 14
      }}
      onPointerEnter={() => {
        setIsIn(true)
      }}
    >
      <AnimatePresence>
        {toasts.map(toast => {
          const offset = calculateOffset(toast, {
            reverseOrder: false,
            gutter: 10
          })
          const ref = el => {
            if (el && typeof toast.height !== 'number') {
              const height = el.getBoundingClientRect().height
              updateHeight(toast.id, height)
            }
          }

          return (
            <motion.div
              key={toast.id}
              initial={{
                opacity: 1,
                x: '0%',
                y: 0
              }}
              transition={{ duration: 0.5 }}
              animate={{
                opacity: toast.visible ? 1 : 0,
                x: toast.visible ? '-100%' : '0%',
                y: offset
              }}
              style={{
                position: 'absolute',
                willChange: 'transform',
                fontSize: 14
              }}
              className={css({
                borderRadius: 10,
                padding: '8px 12px',
                fontWeight: 500,
                minWidth: 180,
                boxShadow: Colors.Background.BoxShadow,
                background: Colors.Background.Secondary,
                display: 'flex',
                gap: 16,
                alignItems: 'center'
              })}
              {...toast.ariaProps}
              ref={ref}
            >
              <>
                {toast.type === 'success' && <Icon fill={'#82CD47'} theme="filled" size={20} name="park-correct" />}
                {toast.type === 'error' && <Icon fill={'#F55050'} theme="filled" size={20} name="park-error" />}
                <div
                  style={{
                    display: 'flex',
                    flex: 1,
                    whiteSpace: 'nowrap'
                  }}
                >
                  {toast.message}
                </div>
              </>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

export default Notification
