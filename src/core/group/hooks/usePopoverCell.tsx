import { ReactElement, RefObject, useLayoutEffect, useRef, useState } from 'react'
import { Box } from '~/typings'
import { createPortal } from 'react-dom'

const usePopoverCell = (opts: { onOpen?: VoidFunction; onClose?: VoidFunction; targetRef?: RefObject<HTMLElement> }) => {
  const [cellState, setCellState] = useState<{
    box?: Box
    visible: boolean
  }>({
    visible: false
  })
  const containerRef = useRef<HTMLElement>()
  const openPopover = (box: HTMLElement) => {
    containerRef.current = box
    const bounding = box.getBoundingClientRect()
    setCellState({
      visible: true,
      box: {
        left: bounding.left - 2,
        top: bounding.top - 2,
        width: bounding.width + 4,
        height: bounding.height + 4
      }
    })
  }

  useLayoutEffect(() => {
    if (cellState.visible) {
      opts.onOpen?.()
      const h = (e: WheelEvent) => {
        if (!opts.targetRef?.current?.contains(e.target)) {
          e.preventDefault()
        }
      }

      const currentbox = opts?.targetRef?.current?.getBoundingClientRect()
      if (currentbox) {
        if (currentbox.bottom > window.innerHeight) {
          setCellState(s => ({
            ...s,
            box: {
              left: currentbox.left,
              top: currentbox.top - (currentbox.bottom - window.innerHeight) - 20,
              width: currentbox.width,
              height: currentbox.height
            }
          }))
        }
        if (currentbox.top < 0) {
          setCellState(s => ({
            ...s,
            visible: true,
            box: {
              left: currentbox.left,
              top: 20,
              width: currentbox.width,
              height: currentbox.height
            }
          }))
        }
      }
      window.addEventListener('wheel', h, { passive: false })
      return () => {
        window.removeEventListener('wheel', h)
        opts?.onClose?.()
      }
    }
  }, [cellState.visible])

  const renderPopover = (renderer: (box: Box) => ReactElement) => {
    if (cellState.box) {
      return createPortal(
        <div
          onPointerDown={e => {
            if (e.target === e.currentTarget) {
              setCellState({ visible: false })
            }
          }}
          style={{ position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: 9990 }}
        >
          {renderer(cellState.box)}
        </div>,
        document.body
      )
    }
  }
  return {
    renderPopover,
    openPopover
  }
}
export default usePopoverCell
