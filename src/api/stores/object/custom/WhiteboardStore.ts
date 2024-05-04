import { IWhiteboardEdge, IWhiteboardNode } from '~/typings'
import createObjectStore from '@/api/stores/object/object.store'

export default () => {
  return createObjectStore('whiteboard', {
    transformData: whiteboard => {
      return {
        ...whiteboard,
        edges: Array.isArray(whiteboard.edges)
          ? new Map((whiteboard.edges as unknown as IWhiteboardEdge[])?.map(e => [e.id, e]))
          : whiteboard.edges instanceof Map
          ? whiteboard.edges
          : new Map(),
        nodes: Array.isArray(whiteboard.nodes)
          ? new Map((whiteboard.nodes as unknown as IWhiteboardNode[])?.map(e => [e.id, e]))
          : whiteboard.nodes instanceof Map
          ? whiteboard.nodes
          : new Map()
      }
    }
  })
}
