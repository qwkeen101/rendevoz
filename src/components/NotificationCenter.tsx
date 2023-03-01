import Zindexes from '@/consts/zindex'
import { useToaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { css } from '@emotion/css'
import { Icon } from '.'

const Notification = () => {
  const { toasts, handlers } = useToaster({
    duration: 4000
  })
  const { startPause, endPause, calculateOffset, updateHeight } = handlers

  return (
    <motion.div
      style={{
        position: 'fixed',
        top: 60,
        right: 60,
        zIndex: Zindexes.Notification
      }}
      onPointerEnter={startPause}
      onPointerLeave={endPause}
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
                willChange: 'transform'
              }}
              className={css({
                borderRadius: 10,
                padding: '12px 16px',
                minWidth: 180,
                backdropFilter: 'blur(24px)',
                backgroundBlendMode: 'overlay',
                boxShadow: '0 10px 15px rgb(0 0 0 / 20%)',
                background: 'rgba(238,238,238,0.7)',
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
                <div style={{ display: 'flex', flex: 1, fontFamily: 'Muli', whiteSpace: 'nowrap' }}>{toast.message}</div>
              </>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </motion.div>
  )
}

export default Notification
