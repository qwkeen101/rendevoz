import { FC, ReactNode, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
const transition = {
  x: { type: 'spring', stiffness: 300, damping: 30 },
  opacity: { duration: 0.2 },
  height: { duration: 0.2 }
}
type custom = {
  direction: number
  previousHeight: number
  currentHeight: number
}
const variants = {
  enter: (c: custom) => {
    return {
      x: c.direction > 0 ? '100%' : '-100%',
      opacity: 0,
      height: c.previousHeight
    }
  },
  center: {
    zIndex: 1,
    x: 0,
    opacity: 1,
    height: 'auto'
  },
  exit: (c: custom) => {
    return {
      zIndex: 0,
      x: c.direction > 0 ? '100%' : '-100%',
      opacity: 0,
      position: 'absolute'
    }
  }
}
const SwitchAnimation: FC<{
  children: (switchWrapper: (children: ReactNode, key: string) => JSX.Element) => ReactNode
  direction: boolean
}> = ({ children, direction }) => {
  const keyToRef = useRef(new Map<string, HTMLElement>())
  const getHeight = (key: string, shouldOther: boolean) => {
    const realKey = shouldOther ? Array.from(keyToRef.current.keys()).filter(i => i !== key)[0] : key
    if (realKey) {
      const node = keyToRef.current.get(realKey)
      const bound = node?.getBoundingClientRect()
      console.log(bound?.height, realKey)
      return bound?.height || 'auto'
    }
    return 'auto'
  }
  const switchWrapper = (children: ReactNode, key: string) => {
    return (
      <motion.div
        ref={node => {
          const keyToRefMap = keyToRef.current
          node && keyToRefMap.set(key, node)
        }}
        custom={{
          direction,
          previousHeight: getHeight(key, true),
          currentHeight: getHeight(key, false)
        }}
        style={{
          willChange: 'opacity,height'
        }}
        transition={transition}
        variants={variants}
        key={key}
        initial="enter"
        animate="center"
        exit="exit"
      >
        {children}
      </motion.div>
    )
  }
  return <AnimatePresence initial={false}>{children ? children(switchWrapper) : null}</AnimatePresence>
}

export default SwitchAnimation
