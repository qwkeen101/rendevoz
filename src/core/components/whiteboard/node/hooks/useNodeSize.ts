import { useLayoutEffect } from 'react'
import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'

export const DEFAULT_NODE_WIDTH = 280
export const DEFAULT_NODE_PADDING = 40
const useNodeSize = (container: HTMLElement | undefined, node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  const flow = useFlow()
  useLayoutEffect(() => {
    if (container) {
      if (!node.width) {
        const bounding = container.getBoundingClientRect()
        const transform = instance.getTransform?.()
        if (transform) {
          const w = Math.max(DEFAULT_NODE_WIDTH, (bounding.width / transform.scale) + DEFAULT_NODE_PADDING)
          const width = node.expanded ? 520 : Math.min(w, 500)

          container.style.width = `${width}px`

          setTimeout(() => {
            instance.updateNode?.(node.id, n => ({
              ...n,
              width,
              height: bounding.height / transform.scale
            }))
            setTimeout(() => {
              flow.resizeObserver.observe(container)
            })
          })
        }
      } else {
        flow.resizeObserver.observe(container)
      }
      return () => {
        flow.resizeObserver.unobserve(container)
      }
    }
  }, [container])
}

export default useNodeSize
