import { cloneElement, ReactElement, RefObject, useLayoutEffect, useRef, useState } from 'react'
import { Box } from '~/typings'
import { createPortal } from 'react-dom'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'

const usePopoverCell = (
  opts: {
    onOpen?: VoidFunction
    onClose?: VoidFunction
    targetRef?: RefObject<HTMLElement>
    closeWhenClickoutside?: boolean
  } = {}
) => {
  const [cellState, setCellState] = useState<{
    box?: Box
    visible: boolean
    realVisible?: boolean
  }>({
    visible: false
  })
  const containerRef = useRef<HTMLElement>()
  const instance = useGroupInstance()
  const popoverRef = useRef<HTMLDivElement>(null)
  const setGroupState = useSetAtom(GroupStateAtom)
  // for inner popover content
  const popoverContentRef = useRef<HTMLElement>(null)
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
    setGroupState(s => ({ ...s, popoverVisible: true }))
    setTimeout(() => {
      const newBounding = box.getBoundingClientRect()
      console.log(box, bounding, newBounding)
      setCellState({
        visible: true,
        box: {
          left: newBounding.left - 2,
          top: newBounding.top - 2,
          width: Math.max(newBounding.width + 4, 280),
          height: newBounding.height + 4
        }
      })
    })
  }

  useLayoutEffect(() => {
    if (cellState.visible) {
      opts.onOpen?.()
      const h = (e: WheelEvent) => {
        const c = opts.targetRef?.current || popoverContentRef.current
        if (c && !c.contains(e.target)) {
          e.preventDefault()
        }
      }
      const k = (e: KeyboardEvent) => {
        if (isHotkey(KEY.Escape, e)) {
          e.preventDefault()
          setCellState({ visible: false })
        }
      }
      const currentEle = opts.targetRef?.current || popoverContentRef.current
      const resizeObserver = new ResizeObserver(cb => {
        const currentbox = cb[0].target.getBoundingClientRect()
        setCellState(s => ({
          ...s,
          box: {
            left: Math.min(window.innerWidth - currentbox.width - 20, currentbox.left),
            top: currentbox.bottom > window.innerHeight ? window.innerHeight - currentbox.height - 20 : Math.max(20, currentbox.top),
            width: currentbox.width,
            height: currentbox.height
          }
        }))
      })
      if (currentEle) {
        resizeObserver.observe(currentEle)
        const currentbox = currentEle.getBoundingClientRect()
        if (currentbox) {
          setCellState(s => ({
            ...s,
            box: {
              left: Math.min(window.innerWidth - currentbox.width - 20, currentbox.left),
              top: currentbox.bottom > window.innerHeight ? window.innerHeight - currentbox.height - 20 : Math.max(20, currentbox.top),
              width: currentbox.width,
              height: currentbox.height
            }
          }))
        }
      }
      setTimeout(() => {
        setCellState(s => ({ ...s, realVisible: true }))
      }, 10)
      window.addEventListener('wheel', h, { passive: false })
      document.addEventListener('keydown', k)
      // document.addEventListener('click', c)
      return () => {
        resizeObserver.disconnect()
        setGroupState(s => ({ ...s, popoverVisible: false }))
        document.removeEventListener('keydown', k)
        window.removeEventListener('wheel', h)
        // document.removeEventListener('click', c)
        opts?.onClose?.()
      }
    }
  }, [cellState.visible])

  const renderPopover = (renderer: (box: Box) => ReactElement, withCover = true) => {
    if (cellState.box && cellState.visible) {
      return createPortal(
        <div
          ref={popoverRef}
          onClick={e => {
            if (withCover && opts.closeWhenClickoutside !== false) {
              console.log(e.target, e.currentTarget)
              if (e.target === e.currentTarget) {
                setCellState({ visible: false })
              }
            }
          }}
          style={
            withCover
              ? { position: 'fixed', left: 0, top: 0, width: '100%', height: '100%', zIndex: 1002, opacity: cellState.realVisible ? 1 : 0 }
              : {
                  zIndex: 99
                }
          }
        >
          {cloneElement(renderer(cellState.box), {
            ref: popoverContentRef
          })}
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
