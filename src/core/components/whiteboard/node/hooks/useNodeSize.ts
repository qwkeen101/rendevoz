import { useEffect, useLayoutEffect } from 'react'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'

const useNodeSize = (container: HTMLElement | undefined, node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  const flow = useFlow()
  useLayoutEffect(() => {
    if (container) {
      if (!node.width || !node.height) {
        const bounding = container.getBoundingClientRect()
        const transform = instance.getTransform?.()
        if (transform) {
          const w = bounding.width / transform.scale
          instance.updateNode?.(node.id, n => ({
            ...n,
            width: node.expanded ? w : Math.min(w, 500),
            height: bounding.height / transform.scale
          }))
          container.style.width = `${node.expanded ? w : Math.min(w, 500)}px`
        }
      }
      flow.resizeObserver.observe(container)
      return () => {
        flow.resizeObserver.unobserve(container)
      }
    }
  }, [container])
}

export default useNodeSize
