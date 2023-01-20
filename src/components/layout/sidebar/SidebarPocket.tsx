import { Icon } from '@/components'
import { useGlobalIsDragging } from '@/components/GlobalDragOverlay'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import { AnimatePresence, motion } from 'framer-motion'
import { forwardRef, useState, useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'
import { MenuItem } from './Item'

const SidebarPocket = forwardRef(({ urls }: { urls: string[] }, ref) => {
  const previousUrls = usePrevious(urls)
  const [globalIsDragging] = useGlobalIsDragging()
  const [draggingHovered, setDraggingHovered] = useState(false)
  const itemRef = useRef<HTMLLIElement>(null)
  const mergedRef = useMergedRef(ref, itemRef)
  const [showPopnumber, setShowpopnumber] = useState({
    incr: false,
    visible: false
  })
  useEffect(() => {
    if (!previousUrls || previousUrls?.length < urls.length) {
      setShowpopnumber({ visible: true, incr: true })
    } else {
      setShowpopnumber({ visible: true, incr: false })
    }
  }, [urls])
  const pointerHandler = useMemoizedFn((e: PointerEvent) => {
    if (e.type === 'pointerenter') {
      console.log(e)
      setDraggingHovered(true)
    } else {
      setDraggingHovered(false)
    }
  })
  useEffect(() => {
    if (globalIsDragging) {
      itemRef.current?.addEventListener('pointerenter', pointerHandler)
      itemRef.current?.addEventListener('pointerup', pointerHandler)
      itemRef.current?.addEventListener('pointerleave', pointerHandler)
      return () => {
        itemRef.current?.removeEventListener('pointerenter', pointerHandler)
        itemRef.current?.removeEventListener('pointerup', pointerHandler)
        itemRef.current?.removeEventListener('pointerleave', pointerHandler)
      }
    }
  }, [globalIsDragging])
  const { incr, visible } = showPopnumber
  return (
    <MenuItem
      style={{
        boxShadow: draggingHovered ? 'rgb(130, 170, 227, 0.4) 0px 0px 0px 3px' : undefined,
        background: draggingHovered ? 'white' : undefined,
        position: 'relative'
      }}
      ref={mergedRef}
    >
      <AnimatePresence>
        {draggingHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              pointerEvents: 'none',
              position: 'absolute',
              top: -10,
              transform: 'translateY(-100%)',
              background: 'rgba(0,0,0,0.8)',
              color: 'white',
              padding: '4px 6px',
              borderRadius: 4
            }}
          >
            Drop to add object into pocket
          </motion.div>
        )}
      </AnimatePresence>
      <Icon name="park-box" style={{ marginRight: 10 }} size={16} />
      Pocket
      {urls.length > 0 && (
        <div style={{ marginLeft: 'auto', marginRight: 5, fontSize: 12, position: 'relative' }}>
          {urls.length}
          <motion.div
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: visible ? 0 : 1, y: visible ? -30 : 0 }}
            transition={{ duration: 1.5, type: 'keyframes' }}
            onAnimationComplete={() => {
              setShowpopnumber({ visible: false, incr })
            }}
            style={{
              position: 'absolute',
              top: '-50%',
              width: '100%',
              left: 0,
              display: 'flex',
              justifyContent: 'center',
              fontSize: 13,
              color: incr ? 'red' : 'green',
              visibility: visible ? 'visible' : 'hidden'
            }}
          >
            {incr ? '+1' : '-1'}
          </motion.div>
        </div>
      )}
    </MenuItem>
  )
})

export default SidebarPocket
