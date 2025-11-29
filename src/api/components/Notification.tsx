import Zindexes from '@/consts/zindex'
import { useToaster } from 'react-hot-toast'
import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from '@/components'
import './notification.less'
import { Icons } from '@/consts'

const Notification = () => {
  const { toasts, handlers } = useToaster({
    duration: 3500
  })
  const { calculateOffset, updateHeight } = handlers
  if (!toasts.length) return null
  return (
    <div
      style={{
        position: 'fixed',
        top: 35,
        left: '50%',
        zIndex: Zindexes.Notification,
        fontSize: 14
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
                opacity: 0,
                x: '-50%',
                y: 0
              }}
              transition={{ duration: 0.13 }}
              animate={{
                opacity: toast.visible ? 1 : 0,
                scale: toast.visible ? 1 : 0.8,
                x: '-50%',
                transformOrigin: 'center',
                y: offset + 20
              }}
              className={'notification'}
              {...toast.ariaProps}
              ref={ref}
            >
              <>
                {toast.type === 'success' && <Icon fill={'#82CD47'} theme="filled" size={18} name="park-correct" />}
                {toast.type === 'error' && <Icon fill={'#F55050'} theme="filled" size={18} name="park-error" />}
                {toast.type === 'loading' && <Icon strokeWidth={4} spin size={18} name={Icons.Loading} />}
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
    </div>
  )
}

export default Notification
