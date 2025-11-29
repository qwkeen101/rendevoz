import { RefObject, useRef } from 'react'
import useThrottleFn from '@/hooks/utils/useThrottleFn'

export default ({
  scrollElementRef,
  wait = 30,
  sensitivity = 30,
  speed = 10,
  onScroll
}: {
  scrollElementRef: RefObject<HTMLElement>
  wait?: number
  sensitivity?: number
  speed?: number
  onScroll?: VoidFunction
}) => {
  const autoScrollAnimationId = useRef<number>()
  const cancelScroll = () => {
    if (autoScrollAnimationId.current) {
      cancelAnimationFrame(autoScrollAnimationId.current)
      autoScrollAnimationId.current = undefined
    }
  }
  const throttledScroll = useThrottleFn(
    (e: PointerEvent) => {
      const ele = scrollElementRef.current
      if (ele) {
        const x = e.clientX
        const y = e.clientY
        const sens = sensitivity
        const bound = ele.getBoundingClientRect()
        const vx = Number(Math.abs(bound.right - x) <= sens) - Number(Math.abs(bound.left - x) <= sens)
        const vy = Number(Math.abs(bound.bottom - y) <= sens) - Number(Math.abs(bound.top - y) <= sens)
        cancelScroll()
        const scroll = () => {
          const scrollOffsetY = vy ? vy * speed : 0
          const scrollOffsetX = vx ? vx * speed : 0
          ele.scrollTop += scrollOffsetY
          ele.scrollLeft += scrollOffsetX
          onScroll?.()
          autoScrollAnimationId.current = requestAnimationFrame(scroll)
        }
        autoScrollAnimationId.current = requestAnimationFrame(scroll)
      }
    },
    { wait }
  )

  return {
    run: (e: PointerEvent) => throttledScroll.run(e),
    end: () => {
      throttledScroll.cancel()
      cancelScroll()
    }
  }
}
