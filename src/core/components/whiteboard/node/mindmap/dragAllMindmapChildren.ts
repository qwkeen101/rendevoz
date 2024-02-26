import { IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import { getFlattenChildrenOfNode } from '@/core/components/whiteboard/node/mindmap/utils/tree'

// update by cache
export default (
  currentNode: IWhiteboardNode,
  instance: IWhiteboardInstance,
  layoutCache: Record<number, { x: number; y: number; side: 'right' | 'left' }>,
  linkIds: string[]
) => {
  const allSubNodes = [
    ...(getFlattenChildrenOfNode(currentNode, instance, 'left') || []),
    ...(getFlattenChildrenOfNode(currentNode, instance, 'right') || [])
  ].map(i => i.root)
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
