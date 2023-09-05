import { useLayoutEffect } from 'react'
import { useFlow } from '@/core/whiteboard/hooks'

const useNodeSize = (container?: HTMLElement) => {
  const flow = useFlow()
  useLayoutEffect(() => {
    if (container) {
      flow.resizeObserver.observe(container)
      return () => {
        flow.resizeObserver.unobserve(container)
      }
    }
  }, [])
}

export default useNodeSize
