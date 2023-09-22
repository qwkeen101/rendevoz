import { IGroupInstance } from '~/typings'
import { RefObject } from 'react'
import { assignProperties } from '@/utils'
import { Virtualizer } from '@tanstack/react-virtual'
import { useDragScroll } from '@/hooks'

const useAssignBodyOps = (instance: IGroupInstance, bodyRef: RefObject<HTMLElement>, virtualizer: Virtualizer<any, any>) => {
  const { startScroll, endScroll } = useDragScroll(bodyRef, {
    onScroll: ymovement => {
      instance.bodyOps?.scrollBody?.({ y: -ymovement })
    }
  })
  assignProperties(instance, {
    bodyOps: {
      scrollBody: movement => {
        if (movement.y !== 0 && movement.y !== undefined) {
          if (virtualizer) {
            virtualizer.scrollBy(movement.y, { behavior: 'auto' })
          }
        }
      },
      startDetectAutoScroll: startScroll,
      endDetectAutoScroll: endScroll
    }
  })
}

export default useAssignBodyOps
