import { IGroupInstance } from '~/typings'
import { RefObject } from 'react'
import { assignProperties } from '@/utils'
import { Virtualizer } from '@tanstack/react-virtual'
import { useDragScroll } from '@/hooks'

const useAssignBodyOps = (instance: IGroupInstance, bodyRef: RefObject<HTMLElement>) => {
  const { startScroll, endScroll } = useDragScroll(bodyRef, {
    onScroll: ymovement => {
      instance.bodyOps?.scrollBody?.({ y: -ymovement })
    }
  })
  assignProperties(instance, {
    bodyOps: {
      scrollBody: movement => {
        if (movement.y !== 0 && movement.y !== undefined) {
          const virtualizer = instance.virtualizer
          if (virtualizer) {
            virtualizer.scrollBy(movement.y, { behavior: 'auto' })
          }
        }
        if (movement.x !== 0 && movement.x !== undefined) {
          const s = instance.getScrollElement?.()
          if (s) {
            s.scrollLeft += movement.x
          }
        }
      },
      startDetectAutoScroll: startScroll,
      endDetectAutoScroll: endScroll
    }
  })
}

export default useAssignBodyOps
