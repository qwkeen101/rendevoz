import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'

// update by cache
export default (currentNode: IWhiteboardNode, instance: IWhiteboardInstance, layoutCache: Record<number, { x: number; y: number }>, linkIds: string[]) => {
  const allSubNodes = Object.keys(layoutCache).map(i => Number(i))
  allSubNodes.forEach(id => {
    const nodeFuncs = instance.nodeOps?.getNodeFuncs(id)
    if (nodeFuncs) {
      const box = nodeFuncs.getRealtimeBox()
      if (!box) return
      const result = {
        x: currentNode.x + layoutCache[id].x,
        y: currentNode.y + currentNode.height / 2 + layoutCache[id].y - box.height / 2
      }
      const s = `translate(${result.x}px,${result.y}px)`
      nodeFuncs.setStyle({
        transform: s
      })
    }
  })
  linkIds.forEach(id => {
    instance.edgeOps?.getEdgeFuncs(id)?.drawPath()
  })
}
