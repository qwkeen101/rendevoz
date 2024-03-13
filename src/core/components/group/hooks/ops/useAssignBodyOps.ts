import { IGroupInstance } from '~/typings'
import { RefObject } from 'react'
import { assignProperties } from '@/utils'
import { Virtualizer } from '@tanstack/react-virtual'
import { useDragScroll } from '@/hooks'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'

const useAssignBodyOps = (instance: InnerGroupInstance, bodyRef: RefObject<HTMLElement>) => {
  const { startScroll, endScroll } = useDragScroll(bodyRef, {
    onScroll: ymovement => {
      instance.bodyOps?.scrollBody?.({ y: -ymovement })
    }
  })
  assignProperties(instance, {
    bodyOps: {
      ...instance.bodyOps,
      scrollBody: movement => {
        const s = instance.getScrollElement?.()
        if (!s) return
        if (movement.y !== 0 && movement.y !== undefined) {
          s.scrollBy(0, movement.y)
        }
        if (movement.x !== 0 && movement.x !== undefined) {
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
