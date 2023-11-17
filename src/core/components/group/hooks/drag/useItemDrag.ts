import { RefObject, useEffect } from 'react'
import { MetaGroupChild } from '~/typings'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useItemDrag = (containerRef: RefObject<HTMLElement>, value: MetaGroupChild) => {
  const instance = useGroupInstance()
  useEffect(() => {
    const pointerHandler = (e: PointerEvent) => {
      if (e.type === 'pointermove') {
        instance.dragOps?.setDragHandle({
          value,
          node: containerRef.current
        })
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
      return () => {
        container.removeAttribute('data-group-item')
        container.removeEventListener('pointermove', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
      }
    }
  })
}

export default useItemDrag
