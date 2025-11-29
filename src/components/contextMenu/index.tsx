import { Noop } from '@/common/types'
import { cloneElement, forwardRef, memo, ReactNode, useEffect, useImperativeHandle, useRef, useState } from 'react'
import AnimatePopover from '../base/AnimatePopover'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export type Placement = 'top' | 'left' | 'right' | 'bottom'

interface ContextMenuProps {
  position?: Placement[]
  content?: React.ReactNode | ((setV: (v: boolean) => void) => React.ReactNode)
  children: React.ReactNode | ((setV: (v: boolean, pos?: number[]) => void) => React.ReactNode)
  onContextMenu?: (e: MouseEvent) => void
  onClose?: Noop
  boundaryInset?: number
  enableContextMenu?: boolean
}
export interface ContextMenuRef {
  closeContextMenu: () => void
}
const ContextMenu = forwardRef<HTMLElement, ContextMenuProps>(
  ({ position = ['right', 'left'], children, content, enableContextMenu = true, boundaryInset, onContextMenu }, ref) => {
    const memoizedPosition = useRef<number[]>([0, 0])
    const childRef = useRef<HTMLElement | undefined>()
    const [contextMenuOpen, setContextMenuOpen] = useState(false)
    const handleRef = (node: HTMLElement) => {
      childRef.current = node
      if (ref) {
        typeof ref === 'function' ? ref(node) : (ref.current = node)
      }
    }
    const renderChild = () =>
      cloneElement(
        typeof children === 'function'
          ? (children((v, pos) => {
              setContextMenuOpen(v)
              pos && (memoizedPosition.current = pos)
            }) as JSX.Element)
          : (children as JSX.Element),
        {
          ref: handleRef
        }
      )
    const renderContent = setV => (typeof content === 'function' ? content(setV) : content)
    const handle = (e: MouseEvent) => {
      if (!enableContextMenu) {
        return
      }
      onContextMenu?.(e)
      e.preventDefault()
      e.stopPropagation()
      memoizedPosition.current = mousePos.current
      setContextMenuOpen(true)
    }
    useEffect(() => {
      childRef.current?.addEventListener('contextmenu', handle)
      return () => childRef.current?.removeEventListener('contextmenu', handle)
    })
    return (
      <>
        {content && (
          <AnimatePopover
            align="start"
            positions={position}
            disableNudge={true}
            onVisiblityChange={s => {
              setContextMenuOpen(s)
            }}
            position={{
              top: memoizedPosition.current?.[1],
              left: memoizedPosition.current?.[0]
            }}
            boundaryInset={boundaryInset}
            reposition={true}
            visible={contextMenuOpen}
            containerStyle={{ zIndex: '1500' }}
            onClickOutside={() => setContextMenuOpen(false)}
            content={setV => renderContent(setV)}
          ></AnimatePopover>
        )}
        {renderChild()}
      </>
    )
  }
)

export default memo(ContextMenu)
