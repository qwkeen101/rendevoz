import { IWhiteboardInstance, XYPosition } from '~/typings'
import { GlobalInstance } from '@/hooks'
import cloneNodes from '@/core/components/whiteboard/hooks/ops/cloneNodes'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export default (instance: IWhiteboardInstance, position: XYPosition) => {
  const currentCopied = GlobalInstance.values.copiedWhiteboardData
  if (currentCopied?.length) {
    const coord = instance.coordOps?.transformWindowPositionToPosition({
      x: position.x,
      y: position.y
    })
    if (!coord) return
    const cloned = cloneNodes(currentCopied)
    const pasteElements = cloned.map(i => ({
      ...i,
      x: i.x + coord.x,
      y: i.y + coord.y
    }))
    instance.updateWhiteboard?.(w => {
      pasteElements.forEach(n => {
        w.nodes?.set(n.id, n)
      })
    }, true)
  }
}
