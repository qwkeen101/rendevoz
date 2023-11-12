import { cloneElement, CSSProperties, FC, forwardRef, PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react'
import { AnimatePopover } from '..'
import { useMemoizedFn, useMergedRef } from '@/hooks'
import Zindexes from '@/consts/zindex'
import { waitFor } from '@/utils/functions'
import { AnimatePopoverProps } from './AnimatePopover'
import FontSize from '@/consts/font'

interface ToolTipProps {
  content?: string | ReactNode
  position?: 'top' | 'bottom' | 'right' | 'left'
  style?: CSSProperties
  delay?: number
  disable?: boolean
  disableDefaultContent?: boolean
  contentTouchable?: boolean
  zIndex?: string | number
  visible?: boolean
  positions?: string[]
  onVisibleChange?: (v: boolean) => void
  parentElement?: AnimatePopoverProps['parentElement']
  padding?: number
  boundaryInset?: number
  align?: AnimatePopoverProps['align']
}

const ToolTip: FC<PropsWithChildren<ToolTipProps>> = (
  {
    content,
    children,
    align,
    delay = 300,
    disable,
    positions,
    boundaryInset = 20,
    disableDefaultContent,
    contentTouchable,
    zIndex,
    visible,
    onVisibleChange,
    parentElement,
    position,
    padding = 10
  },
  ref
) => {
  const [open, setOpen] = useState(false)
  const childRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const mergedRef = useMergedRef(childRef, ref)
  const isInRef = useRef(false)
  const isKeyDownRef = useRef(false)
  const isInContentRef = useRef(false)
  const handleMouseEvent = useMemoizedFn((e: MouseEvent) => {
    const pointerUphandler = e => {
      if (e.type === 'pointerup') {
        if (delay) {
          setTimeout(() => {
            isKeyDownRef.current = false
          }, delay + 10)
        } else {
          isKeyDownRef.current = false
        }
        document.removeEventListener('pointerup', pointerUphandler)
      }
    }
    if (e.type === 'pointerdown') {
      isKeyDownRef.current = true
      document.addEventListener('pointerup', pointerUphandler)
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
      if (!open) return

      if (contentTouchable) {
        setTimeout(() => {
          if (!isInContentRef.current) {
            if (e.relatedTarget instanceof HTMLElement && contentRef.current?.contains(e.relatedTarget)) {
              return
            }
            setOpen(false)
          }
        }, 500)
      } else {
        setOpen(false)
      }
    }
  })
  useEffect(() => {
    onVisibleChange?.(open)
  }, [open])

  useEffect(() => {
    if (visible !== undefined && open !== visible) {
      setOpen(visible)
    }
  }, [visible])
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
          background: 'rgba(0,0,0,0.6)',
          color: 'white',
          borderRadius: 4,
          lineHeight: 1.2,
          padding: '2px 4px 2px',
          fontSize: FontSize['13px']
        }}
      >
        {content}
      </div>
    )
  }

  useEffect(() => {
    if (contentTouchable && open) {
      waitFor(
        () => !!contentRef.current,
        () => {
          const contentContainer = contentRef.current
          if (contentContainer) {
            const pointerHandler = (e: PointerEvent) => {
              if (e.type === 'pointerenter') {
                isInContentRef.current = true
              }
              if (e.type === 'pointerleave') {
                isInContentRef.current = false
                setTimeout(() => {
                  if (
                    !(e.relatedTarget instanceof HTMLElement && childRef.current?.contains(e.relatedTarget)) &&
                    isInContentRef.current === false
                  ) {
                    console.log('close here')
                    setOpen(false)
                  }
                }, 500)
              }
            }
            setTimeout(() => {
              contentContainer.addEventListener('pointerenter', pointerHandler)
              contentContainer.addEventListener('pointerleave', pointerHandler)
            })
            return () => {
              contentContainer.removeEventListener('pointerenter', pointerHandler)
              contentContainer.removeEventListener('pointerleave', pointerHandler)
            }
          }
        }
      )
    }
  }, [contentTouchable, open])
  return (
    children && (
      <AnimatePopover
        containerStyle={{
          zIndex: zIndex ? String(zIndex) : String(Zindexes.Tooltip)
        }}
        padding={padding}
        align={align}
        content={renderContent()}
        boundaryElement={document.body}
        reposition={true}
        boundaryInset={boundaryInset}
        positions={positions || ['top', 'bottom', 'left', 'right']}
        parentElement={parentElement}
        innerRef={mergedRef}
        visible={!!content && open && !disable}
        onVisiblityChange={v => v !== open && setOpen(v)}
      >
        {renderChildren()}
      </AnimatePopover>
    )
  )
}

export default forwardRef(ToolTip)
