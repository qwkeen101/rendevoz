import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'

// update by cache
export default (
  currentNode: IWhiteboardNode,
  instance: IWhiteboardInstance,
  layoutCache: Record<number, { x: number; y: number; side: 'right' | 'left' }>,
  linkIds: string[]
) => {
  const allSubNodes = Object.keys(layoutCache).map(i => Number(i))
  console.log(layoutCache)
  instance.nodeOps?.updateRelatedEdges(allSubNodes)
  allSubNodes.forEach(id => {
    const nodeFuncs = instance.nodeOps?.getNodeFuncs(id)
    if (nodeFuncs) {
      const result = {
        x: currentNode.x + layoutCache[id].x,
        y: currentNode.y + layoutCache[id].y
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
