import { ReactElement, RefObject, useLayoutEffect, useRef, useState } from 'react'
import { Box } from '~/typings'
import { createPortal } from 'react-dom'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const usePopoverCell = (opts: {
  onOpen?: VoidFunction
  onClose?: VoidFunction
  targetRef?: RefObject<HTMLElement>
  closeWhenClickoutside?: boolean
}) => {
  const [cellState, setCellState] = useState<{
    box?: Box
    visible: boolean
  }>({
    visible: false
  })
  const containerRef = useRef<HTMLElement>()
  const instance = useGroupInstance()
  const popoverRef = useRef<HTMLDivElement>(null)
  const openPopover = (box: HTMLElement) => {
    containerRef.current = box
    const bounding = box.getBoundingClientRect()
    if (bounding.left < 100) {
      instance.bodyOps?.scrollBody({ x: bounding.left - 100 })
    }
    if (bounding.right > window.innerWidth - 100) {
      instance.bodyOps?.scrollBody({ x: bounding.right - window.innerWidth + 100 })
    }
    if (bounding.bottom > window.innerHeight && window.innerHeight - bounding.top < 400) {
      const minYView = bounding.top + Math.min(400, bounding.height) + 100
      instance.bodyOps?.scrollBody({
        y: minYView - window.innerHeight
      })
    }
    const newBounding = box.getBoundingClientRect()
    setCellState({
      visible: true,
      box: {
        left: newBounding.left - 2,
        top: newBounding.top - 2,
        width: Math.max(newBounding.width + 4, 280),
        height: newBounding.height + 4
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
      // const c = (e: MouseEvent) => {
      //   if (opts.closeWhenClickoutside === false) return
      //   if (!popoverRef.current?.contains(e.target)) {
      //     setCellState({ visible: false })
      //   }
      // }

      const currentbox = opts?.targetRef?.current?.getBoundingClientRect()
      if (currentbox) {
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
      // document.addEventListener('click', c)
      return () => {
        window.removeEventListener('wheel', h)
        // document.removeEventListener('click', c)
        opts?.onClose?.()
      }
    }
  }, [cellState.visible])

  const renderPopover = (renderer: (box: Box) => ReactElement, withCover = true) => {
    if (cellState.box) {
      return createPortal(
        <div
          ref={popoverRef}
          onClick={e => {
            if (withCover && opts.closeWhenClickoutside !== false) {
              console.log(e.target, e.currentTarget)
              if (e.target === e.currentTarget) {
                setCellState({ visible: false })
                console.log('set here')
              }
            }
          }}
          style={withCover ? { position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: 9990 } : undefined}
        >
          {renderer(cellState.box)}
        </div>,
        document.body
      )
    }
  }
  return {
    renderPopover,
    openPopover,
    closePopover: () => setCellState({ visible: false })
  }
}
export default usePopoverCell
