import { RefObject, useEffect, useRef } from 'react'
import { MetaGroupChild } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useItemDrag = (
  containerRef: RefObject<HTMLElement>,
  value: MetaGroupChild,
  options?: {
    clickDrag?: boolean
    draggable?: boolean
    dragTriggerRef?: RefObject<HTMLElement>
  }
) => {
  const instance = useGroupInstance()
  const pDownRef = useRef({
    x: 0,
    y: 0,
    down: false
  })
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      const pDown = pDownRef.current
      if (e.type === 'pointermove') {
        const currView = instance.getCurrentView?.()
        // can not drag if have filter/sort/search
        if (currView?.search || currView?.sort?.sorters.length || currView?.filter?.rules.length) return
        instance.dragOps?.setDragHandle({
          value,
          node: containerRef.current
        })
        if (pDown.down && container && options?.draggable) {
          if (Math.abs(e.clientX - pDown.x) >= 2 || Math.abs(e.clientY - pDown.y) >= 2) {
            instance.dragOps?.startDrag({ value, node: container })
            pDown.down = false
          }
        }
      }
      if (e.type === 'pointerup') {
        pDown.down = false
      }
      if (e.type === 'pointerdown') {
        if (e.button === 0) {
          if (options?.draggable === false) return
          if (options?.dragTriggerRef) {
            const trigger = options.dragTriggerRef.current
            if (trigger && !trigger.contains(e.target)) return
          }
          pDown.x = e.clientX
          e.preventDefault()
          pDown.y = e.clientY
          pDown.down = true
        }
      }
      if (e.type === 'pointerleave') {
        setTimeout(() => instance.dragOps?.removeDragHandle(), 200)
      }
    }
    const container = containerRef.current
    if (container) {
      container.setAttribute('data-group-item', 'true')
      container.addEventListener('pointermove', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      container.addEventListener('pointerup', pointerHandler)
      if (options?.clickDrag) {
        container.addEventListener('pointerdown', pointerHandler)
      }
      return () => {
        container.removeAttribute('data-group-item')
        container.removeEventListener('pointerup', pointerHandler)
        container.removeEventListener('pointermove', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
        container.removeEventListener('pointerdown', pointerHandler)
      }
    }
  }, [options?.draggable])
}

export default useItemDrag
