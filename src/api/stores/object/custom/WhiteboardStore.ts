import { IWhiteboardEdge, IWhiteboardNode } from '~/typings'
import createObjectStore from '@/api/stores/object/object.store'

export default function createWhiteboardStore() {
  return createObjectStore('whiteboard', {
    afterGetOneProcess: {
      onBeforeCache: whiteboard => {
        if (Array.isArray(whiteboard.edges) || Array.isArray(whiteboard.nodes)) {
          return {
            ...whiteboard,
            edges: new Map((whiteboard.edges as unknown as IWhiteboardEdge[])?.map(e => [e.id, e])),
            nodes: new Map((whiteboard.nodes as unknown as IWhiteboardNode[])?.map(e => [e.id, e]))
          }
        }
        return whiteboard
      }
    },
  })
}
