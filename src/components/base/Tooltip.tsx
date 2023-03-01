import { CSSProperties, FC, forwardRef, PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePopover } from '..'
import { useMergedRef } from '@/hooks'

interface ToolTipProps {
  content: string | ReactNode
  position?: 'top' | 'bottom'
  style?: CSSProperties
  delay?: number
  disable?: boolean
}

const ToolTip: FC<PropsWithChildren<ToolTipProps>> = ({ content, children, position = 'bottom', style, delay = 300, disable }, ref) => {
  const [open, setOpen] = useState(false)
  const childRef = useRef<HTMLElement>(null)
  const mergedRef = useMergedRef(childRef, ref)
  const isInRef = useRef(false)
  const isKeyDownRef = useRef(false)
  const handleMouseEvent = (e: MouseEvent) => {
    if (e.type === 'pointerdown') {
      isKeyDownRef.current = true
      setOpen(false)
    }
    if (e.type === 'pointerenter') {
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
    }
    if (e.type === 'pointerleave') {
      isInRef.current = false
      isKeyDownRef.current = false
      setOpen(false)
    }
  }
  useEffect(() => {
    const child = childRef.current
    if (child) {
      child.addEventListener('pointerdown', handleMouseEvent)
      child.addEventListener('pointerenter', handleMouseEvent)
      child.addEventListener('pointerleave', handleMouseEvent)
    }
    return () => {
      child?.removeEventListener('pointerdown', handleMouseEvent)
      child?.removeEventListener('pointerenter', handleMouseEvent)
      child?.removeEventListener('pointerleave', handleMouseEvent)
    }
  }, [childRef])
  const renderChildren = () => {
    if (typeof children === 'string') {
      return <span>{children}</span>
    }
    if (typeof children === 'object') {
      return children
    }
    return <div></div>
  }
  const renderContent = () => {
    return (
      <div
        style={{
          pointerEvents: 'none',
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          borderRadius: 4,
          lineHeight: 1.2,
          padding: '2px 4px 4px'
        }}
      >
        {content}
      </div>
    )
  }
  return (
    <>
      {children && (
        <AnimatePopover padding={10} content={renderContent()} positions={[position]} innerRef={mergedRef} visible={content && open}>
          {renderChildren()}
        </AnimatePopover>
      )}
    </>
  )
}

export default forwardRef(ToolTip)
