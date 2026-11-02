import { Store } from 'jotai/vanilla'
import { Draft } from 'immer'
import { ensureMap } from '../utils'
import { IWhiteboardInstance } from '../../types'
import { IWhiteboard, IWhiteboardEdge } from '../../types/whiteboard'

export const assignEdgeOps = (
  instance: IWhiteboardInstance,
  store: Store,
  updateWhiteboard: (updater: (draft: Draft<IWhiteboard>) => void, withUndo?: boolean) => Promise<void>
) => {
  instance.edgeOps = {
    addEdge: (sourceId, targetId, overrides) => {
      const id = overrides?.id ?? Date.now()
      let created: IWhiteboardEdge | undefined
      updateWhiteboard(draft => {
        const edges = ensureMap(draft.edges)
        created = {
          id,
          sourceId,
          targetId,
          sourcePosition: 'right',
          targetPosition: 'left',
          lineType: 'curve',
          ...overrides
        } as IWhiteboardEdge
        edges.set(id, created)
        draft.edges = edges
      }, true)
      if (created) {
        instance.emit?.({ type: 'edgeAdded', edge: created })
      }
    },
    deleteEdge: id => {
      updateWhiteboard(draft => {
        const edges = ensureMap(draft.edges)
        edges.delete(id)
        draft.edges = edges
      }, true)
    },
    updateEdge: (id, updater, withUndo = true) => {
      updateWhiteboard(draft => {
        const edges = ensureMap(draft.edges)
        const origin = edges.get(id)
        if (!origin) return
        const next = typeof updater === 'function' ? updater(origin) : { ...origin, ...(updater as Partial<IWhiteboardEdge>) }
        edges.set(id, next as IWhiteboardEdge)
        draft.edges = edges
      }, withUndo)
    }
  }
}
