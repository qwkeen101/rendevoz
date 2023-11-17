import { atom, useAtomValue } from 'jotai'
import { IWhiteboardEdge, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import { assignProperties } from '@/utils'
import { useFlow } from '@/core/components/whiteboard/hooks'
import Id from '@/utils/id'

export const WhiteboardInstanceAtom = atom<Partial<IWhiteboardInstance>>({})

export const useWhiteboardInstance = () => useAtomValue(WhiteboardInstanceAtom)

export const useAssignWhiteboardInstance = () => {
  const updateWhiteboard = useUpdateWhiteboard()
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  assignProperties(instance, {
    deleteNode: id => {
      updateWhiteboard(w => {
        w.nodes?.delete(id)
        flow.NODE_TO_EDGE_MAP.get(id)?.forEach(l => {
          w.edges?.delete(l)
        })
      }, true)
    },
    deleteEdge: id => {
      updateWhiteboard(w => {
        w.edges?.delete(id)
      }, true)
    },
    insertNode: async node => {
      console.log(node)
      if (!node.type || node.x === undefined || node.y === undefined) return Promise.reject()
      const newNode = {
        ...node,
        id: node.id || Id.getId()
      } as Required<IWhiteboardNode>
      await updateWhiteboard(w => {
        w.nodes?.set(newNode.id, newNode)
      }, true)
      return newNode
    },
    updateEdge: async (obj, updater, withUndo = true) => {
      let id: number | undefined = undefined
      if (typeof obj === 'number') {
        id = obj
      }
      if (typeof obj === 'object') {
        id = obj.id
      }
      if (!id) return
      await updateWhiteboard(w => {
        const origin = w.edges?.get(id!)
        if (origin) {
          const newNode = (updater ? updater(origin) : typeof obj === 'object' ? { ...origin, ...obj } : undefined) as
            | IWhiteboardEdge
            | undefined
          if (newNode) {
            w.edges?.set(id!, newNode)
          }
        }
      }, withUndo)
    },
    updateNode: async (obj, updater, withUndo = true) => {
      let id: number | undefined = undefined
      if (typeof obj === 'number') {
        id = obj
      }
      if (typeof obj === 'object') {
        id = obj.id
      }
      if (!id) return
      await updateWhiteboard(w => {
        const origin = w.nodes?.get(id!)
        if (origin) {
          const newNode = (updater ? updater(origin) : typeof obj === 'object' ? { ...origin, ...obj } : undefined) as
            | IWhiteboardNode
            | undefined
          if (newNode) {
            w.nodes?.set(id!, newNode)
          }
        }
      }, withUndo)
    },
    deleteNodes: ids => {
      updateWhiteboard(w => {
        ids.forEach(i => {
          w.nodes?.delete(i)
          flow.NODE_TO_EDGE_MAP.get(i)?.forEach(l => {
            w.edges?.delete(l)
          })
        })
      }, true)
    }
  })
}
