import { atom, useAtomValue, useStore } from 'jotai'
import { IWhiteboardEdge, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'
import { assignProperties } from '@/utils'
import { WhiteboardAtom } from '@/core/components/whiteboard/StateHooks'
import Id from '@/utils/id'
import assignLayoutOps from '@/core/components/whiteboard/hooks/ops/layout'
import assignNodeOps from '@/core/components/whiteboard/hooks/ops/node'
import assignCoordOps from '@/core/components/whiteboard/hooks/ops/coord'
import assignContainerOps from '@/core/components/whiteboard/hooks/ops/container'
import assignGroupOps from '@/core/components/whiteboard/hooks/ops/group'
import assignLineOps from '@/core/components/whiteboard/hooks/ops/line'
import useWhiteboardHighlight from '@/core/components/whiteboard/hooks/useWhiteboardHighlight'
import assignContentOps from '@/core/components/whiteboard/hooks/ops/content'

export const WhiteboardInstanceAtom = atom<IWhiteboardInstance>({})

export const useWhiteboardInstance = () => useAtomValue(WhiteboardInstanceAtom)

export const useAssignWhiteboardInstance = () => {
  const updateWhiteboard = useUpdateWhiteboard()
  const instance = useWhiteboardInstance()
  const store = useStore()
  assignProperties(instance, {
    deleteNode: id => {
      updateWhiteboard(w => {
        w.nodes?.delete(id)
        instance.values.NODE_TO_EDGE_MAP.get(id)?.forEach(l => {
          w.edges?.delete(l)
        })
      }, true)
    },
    getNode: id => {
      const n = store.get(WhiteboardAtom)?.nodes?.get(id)
      if (!n) {
        throw new Error('Can not find whiteboard node with id: ' + id)
      }
      return n
    },
    deleteEdge: id => {
      updateWhiteboard(w => {
        w.edges?.delete(id)
      }, true)
    },
    updateWhiteboard: updateWhiteboard,
    insertNode: async node => {
      if (!node.type || node.x === undefined || node.y === undefined) return Promise.reject()
      const newNode = {
        ...node,
        id: node.id || Id.getId()
      } as Required<IWhiteboardNode>
      await updateWhiteboard(w => {
        if (w.nodes) {
          w.nodes?.set(newNode.id, { ...newNode, z: w.nodes?.size })
          newNode.z = w.nodes?.size
        }
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
          instance.values.NODE_TO_EDGE_MAP.get(i)?.forEach(l => {
            w.edges?.delete(l)
          })
        })
      }, true)
    }
  })
  assignLayoutOps(instance)
  assignNodeOps(instance)
  assignCoordOps(instance)
  useWhiteboardHighlight()
  assignContainerOps(instance)
  assignLineOps(instance)
  assignGroupOps(instance)
  assignContentOps(instance)
}
