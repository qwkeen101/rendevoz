import { cloneElement, CSSProperties, FC, forwardRef, PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePopover } from '..'
import { useMergedRef } from '@/hooks'
import Zindexes from '@/consts/zindex'

interface ToolTipProps {
  content?: string | ReactNode
  position?: 'top' | 'bottom'
  style?: CSSProperties
  delay?: number
  disable?: boolean
  disableDefaultContent?: boolean
  contentTouchable?: boolean
}

const ToolTip: FC<PropsWithChildren<ToolTipProps>> = (
  { content, children, position = 'top', style, delay = 300, disable, disableDefaultContent, contentTouchable },
  ref
) => {
  const [open, setOpen] = useState(false)
  const childRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const mergedRef = useMergedRef(childRef, ref)
  const isInRef = useRef(false)
  const isKeyDownRef = useRef(false)
  const isInContentRef = useRef(false)
  const handleMouseEvent = (e: MouseEvent) => {
    if (e.type === 'pointerdown') {
      isKeyDownRef.current = true
      setOpen(false)
    }
    if (e.type === 'pointerenter') {
      if (e.target !== e.currentTarget) return
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
      if (contentTouchable) {
        setTimeout(() => {
          if (!isInContentRef.current) {
            setOpen(false)
          }
        }, 300)
      } else {
        setOpen(false)
      }
    }
  }
  useEffect(() => {
    const child = childRef.current
    if (child && content) {
      child.addEventListener('pointerdown', handleMouseEvent)
      child.addEventListener('pointerenter', handleMouseEvent)
      child.addEventListener('pointerleave', handleMouseEvent)
    }
    return () => {
      child?.removeEventListener('pointerdown', handleMouseEvent)
      child?.removeEventListener('pointerenter', handleMouseEvent)
      child?.removeEventListener('pointerleave', handleMouseEvent)
    }
  }, [childRef, content])

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
    if (disableDefaultContent) {
      return cloneElement(content, {
        ref: node => (contentRef.current = node)
      })
    }
    return (
      <div
        ref={contentRef}
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
  useEffect(() => {
    if (contentTouchable) {
      setTimeout(() => {
        const contentContainer = contentRef.current
        if (contentContainer) {
          const pointerHandler = (e: PointerEvent) => {
            if (e.type === 'pointerenter') {
              isInContentRef.current = true
            }
            if (e.type === 'pointerleave') {
              isInContentRef.current = false
              setOpen(false)
            }
          }
          contentContainer.addEventListener('pointerenter', pointerHandler)
          contentContainer.addEventListener('pointerleave', pointerHandler)
          return () => {
            contentContainer.removeEventListener('pointerenter', pointerHandler)
            contentContainer.removeEventListener('pointerleave', pointerHandler)
          }
        }
      })
    }
  }, [contentTouchable, open])
  return (
    <>
      {children && (
        <AnimatePopover
          containerStyle={{ zIndex: String(Zindexes.Tooltip) }}
          padding={10}
          content={renderContent()}
          boundaryElement={document.body}
          boundaryInset={20}
          positions={[position]}
          innerRef={mergedRef}
          visible={!!content && open && !disable}
        >
          {renderChildren()}
        </AnimatePopover>
      )}
    </>
  )
}

export default forwardRef(ToolTip)
