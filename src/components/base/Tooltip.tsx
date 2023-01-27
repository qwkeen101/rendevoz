import {
  Children,
  cloneElement,
  createElement,
  CSSProperties,
  FC,
  forwardRef,
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'

interface ToolTipProps {
  content: string | ReactNode
  position?: 'top' | 'bottom'
  style?: CSSProperties
  delay?: number
}

const ToolTip: FC<PropsWithChildren<ToolTipProps>> = ({ content, children, position = 'bottom', style, delay = 300 }, ref) => {
  const [open, setOpen] = useState(false)
  const [bound, setBound] = useState({
    x: 0,
    y: 0,
    width: 0,
    height: 0
  })
  const childRef = useRef<HTMLElement>(null)
  const isInRef = useRef(false)
  const isKeyDownRef = useRef(false)
  const handleChildRef = useCallback(
    (node: HTMLElement) => {
      childRef.current = node
      if (ref != null) {
        if (typeof ref === 'object') {
          ref.current = node
        } else if (typeof ref === 'function') {
          ref(node)
        }
      }
    },
    [ref]
  )
  const handleMouseEvent = (e: MouseEvent) => {
    if (e.type === 'mousedown') {
      isKeyDownRef.current = true
      setOpen(false)
    }
    if (e.type === 'mouseenter') {
      isInRef.current = true
      if (delay) {
        setTimeout(() => {
          if (isInRef.current && !isKeyDownRef.current) {
            setOpen(true)
          }
        }, delay)
      } else {
        setOpen(true)
      }
      const rect = e.currentTarget.getBoundingClientRect()
      const { scrollTop, scrollLeft } = document.body
      const bound = { x: rect.left + scrollLeft, y: rect.top + scrollTop, width: rect.width, height: rect.height }

      if (position === 'top') {
        bound.y = rect.top + scrollTop - rect.height - 40
      }
      setBound(bound)
    }
    if (e.type === 'mouseleave') {
      isInRef.current = false
      isKeyDownRef.current = false
      setOpen(false)
    }
  }
  useEffect(() => {
    const child = childRef.current
    if (child) {
      child.addEventListener('mousedown', handleMouseEvent)
      child.addEventListener('mouseenter', handleMouseEvent)
      child.addEventListener('mouseleave', handleMouseEvent)
    }
    return () => {
      child?.removeEventListener('mousedown', handleMouseEvent)
      child?.removeEventListener('mouseenter', handleMouseEvent)
      child?.removeEventListener('mouseleave', handleMouseEvent)
    }
  }, [childRef])
  const renderChild = () =>
    cloneElement(children as JSX.Element, {
      ref: handleChildRef
    })

  return (
    <>
      {renderChild()}
      <AnimatePresence>{open && content && <ToolTipPopover bound={bound} children={content} style={style} />}</AnimatePresence>
    </>
  )
}
const ToolTipInner = ({ children, bound, style }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    style={{
      left: bound.x + bound.width / 2,
      top: bound.y,
      pointerEvents: 'none',
      transform: `translate3d(-50%,${bound.height + 10}px,0)`,
      background: 'rgba(0,0,0,0.6)',
      color: 'white',
      borderRadius: 4,
      lineHeight: 1.2,
      padding: '2px 4px 4px',
      position: 'absolute',
      zIndex: 100000,
      ...style
    }}
  >
    {children}
  </motion.div>
)
const ToolTipPopover = ({ children, bound, style }) => {
  return createPortal(
    <ToolTipInner style={style} bound={bound}>
      {children}
    </ToolTipInner>,
    document.body
  )
}
export default forwardRef(ToolTip)
