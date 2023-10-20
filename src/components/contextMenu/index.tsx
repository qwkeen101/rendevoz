import { Noop } from '@/common/types'
import { useMousePositionRef } from '@/hooks'
import { cloneElement, forwardRef, memo, ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useClickAway } from 'react-use'
import AnimatePopover from '../base/AnimatePopover'
import { ContextMenuContext, ContextMenuProvider } from './ContextMenuProvider'

export type Placement = 'top' | 'left' | 'right' | 'bottom'

interface ContextMenuProps {
  position?: Placement[]
  content: React.ReactNode
  children: React.ReactNode
  onContextMenu?: (elementX: number, elementY: number, relativeX: number, relativeY: number) => void
  onClose?: Noop
  enableContextMenu?: boolean
}
export interface ContextMenuRef {
  closeContextMenu: () => void
}
const ContextMenu = forwardRef<ContextMenuRef, ContextMenuProps>(
  ({ position = ['right', 'left'], children, content, onContextMenu, onClose, enableContextMenu = true }, ref) => {
    const mousePos = useMousePositionRef()
    const [inContainerMousePos, setInContainerMousePos] = useState<ContextMenuContext>()
    const memoizedPosition = useRef<[number, number]>([0, 0])
    const childRef = useRef<HTMLElement | undefined>()
    const [contextMenuOpen, setContextMenuOpen] = useState(false)
    const contentRef = useRef<HTMLElement>()
    const handleRef = (node: HTMLElement) => {
      childRef.current = node
    }
    const closeContextMenu = () => {
      setContextMenuOpen(false)
      onClose?.()
    }
    useImperativeHandle(ref, () => ({ closeContextMenu }), [])
    const renderChild = () =>
      cloneElement(children as JSX.Element, {
        ref: handleRef
      })
    const renderContent = () => <ContextMenuProvider value={inContainerMousePos}>{content}</ContextMenuProvider>
    const handle = (e: MouseEvent) => {
      if (!enableContextMenu) {
        return
      }
      e.preventDefault()
      e.stopPropagation()
      if (childRef.current) {
        const { left, top, width, height } = childRef.current.getBoundingClientRect()
        const eleX = e.pageX - left - window.scrollX
        const eleY = e.pageY - top - window.scrollY
        const relativeX = eleX / width
        const relativeY = eleY / height
        onContextMenu?.(eleX, eleY, relativeX, relativeY)
        setInContainerMousePos({
          docX: mousePos.current[0],
          docY: mousePos.current[1],
          eleX: eleX,
          eleY: eleY,
          relX: relativeX,
          relY: relativeY
        })
      }
      memoizedPosition.current = mousePos.current
      setContextMenuOpen(true)
    }
    useEffect(() => {
      childRef.current?.addEventListener('contextmenu', handle)
      return () => childRef.current?.removeEventListener('contextmenu', handle)
    })
    useClickAway(contentRef, () => {
      setContextMenuOpen(false)
      onClose?.()
    })
    return (
      <>
        <AnimatePopover
          align="start"
          positions={position}
          disableNudge={true}
          position={{
            top: memoizedPosition.current?.[1],
            left: memoizedPosition.current?.[0]
          }}
          reposition={true}
          visible={contextMenuOpen}
          containerStyle={{ zIndex: '1000' }}
          content={<div ref={contentRef}>{renderContent()}</div>}
        >

        </AnimatePopover>
        {renderChild()}
      </>
    )
  }
)
interface PosHelperProps {
  top?: number
  left?: number
  children?: ReactNode
}
export const PosHelper = forwardRef<HTMLDivElement, PosHelperProps>(({ top, left, children }, ref) => {
  return createPortal(
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: top,
        left: left,
        width: 1,
        height: 1
      }}
    >
      {children}
    </div>,
    document.body
  )
})
export default memo(ContextMenu)
