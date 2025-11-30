import { atom, createStore } from 'jotai'
import { selectAtom } from 'jotai/utils'
import { Draft, Patch, applyPatches, produceWithPatches } from 'immer'
import { useAtomValue, useSetAtom } from 'jotai/react'
import { IWhiteboard, WhiteboardState } from '../types/whiteboard'
import { IWhiteboardInstance, WhiteboardEvent, WhiteboardSelection } from '../types/instance'
import { WhiteboardAdapter } from '../adapters/types'
import { nextId as nextGeneratedId } from '../utils'
import { ensureMap } from './utils'
import { assignSelectionOps } from './ops/selection'
import { assignNodeOps } from './ops/node'
import { assignEdgeOps } from './ops/edge'
import { assignLayoutOps } from './ops/layout'
import { assignCoordOps } from './ops/coord'
import { assignContainerOps } from './ops/container'
import { assignHistoryOps } from './ops/history'
import { getDefaultNodeRenderers } from '../components/renderers'

export const normalizeWhiteboard = (value: IWhiteboard): IWhiteboard => {
  return {
    ...value,
    nodes: ensureMap(value.nodes),
    edges: ensureMap(value.edges),
    id: value.id ?? Date.now()
  }
}

export const WhiteboardAtom = atom<IWhiteboard>(normalizeWhiteboard({ nodes: new Map(), edges: new Map(), id: Date.now() }))

export const WhiteboardStateAtom = atom<WhiteboardState>({
  zoom: 1,
  dragMode: 'drag',
  freeDrawing: false,
  toolbarPointerMode: 'select',
  pointerMode: 'select',
  isDraggingNode: false,
  isErasing: false,
  isPanning: false,
  isSelecting: false,
  loaded: false,
  history: {
    undoSteps: 0,
    redoSteps: 0
  },
  edgeSnapRadius: 48,
  edgeSnapPrefer: 'auto',
  edgeHandleOffset: 4,
  nodeRenderers: getDefaultNodeRenderers(),
  freeHandConfig: {
    type: 'ballpen',
    color: '#000000'
  },
  lastViewport: {
    x: 0,
    y: 0,
    scale: 1
  }
})

export const WhiteboardSelectionAtom = atom<WhiteboardSelection>({ nodes: new Set(), edges: new Set() })

export const WhiteboardInstanceAtom = atom<IWhiteboardInstance>({ values: {} })

export const useWhiteboardValue = () => useAtomValue(WhiteboardAtom)
export const useWhiteboardState = () => useAtomValue(WhiteboardStateAtom)
export const useSetWhiteboardState = () => useSetAtom(WhiteboardStateAtom)

export const useSelectWhiteboardValue = <Slice>(selector: (value: IWhiteboard) => Slice) => {
  const sliceAtom = selectAtom(WhiteboardAtom, selector)
  return useAtomValue(sliceAtom)
}

export const useSelectWhiteboardState = <Slice>(selector: (value: WhiteboardState) => Slice) => {
  const sliceAtom = selectAtom(WhiteboardStateAtom, selector)
  return useAtomValue(sliceAtom)
}

export type CreateWhiteboardStoreParams = {
  value: IWhiteboard
  onChange?: (value: IWhiteboard) => void
  onPatch?: (patches: Patch[], inversePatches: Patch[]) => void
  adapter?: WhiteboardAdapter
}

const nextId = (() => {
  let seed = Date.now()
  return () => {
    seed += 1
    return seed
  }
})()

export const createWhiteboardStore = ({ value, onChange, onPatch, adapter }: CreateWhiteboardStoreParams) => {
  const store = createStore()
  const normalized = normalizeWhiteboard(value)
  store.set(WhiteboardAtom, normalized)

  const eventListeners = new Map<WhiteboardEvent['type'], Set<(event: WhiteboardEvent) => void>>()

  const updateWhiteboard = async (updater: (draft: Draft<IWhiteboard>) => void, withUndo?: boolean) => {
    const current = store.get(WhiteboardAtom)
    const [next, patches, inversePatches] = produceWithPatches(current, draft => {
      updater(draft)
      draft.nodes = ensureMap(draft.nodes)
      draft.edges = ensureMap(draft.edges)
    })
    store.set(WhiteboardAtom, next)
    onChange?.(next)
    if (withUndo && patches.length) {
      onPatch?.(patches, inversePatches)
      instance.historyOps?._pushInternal?.({ patches, inversePatches })
    }
  }

  const instance: IWhiteboardInstance = {
    values: {
      id: normalized.id,
      store,
      ID_TO_NODE_MAP: new Map(),
      ID_TO_EDGE_MAP: new Map(),
      NODE_TO_EDGE_MAP: new Map(),
      copiedElements: [],
      isFocused: false
    },
    getState: () => store.get(WhiteboardStateAtom),
    setState: updater => {
      store.set(WhiteboardStateAtom, updater(store.get(WhiteboardStateAtom)))
    },
    getNode: id => store.get(WhiteboardAtom).nodes?.get(id),
    getEdge: id => store.get(WhiteboardAtom).edges?.get(id),
    getAllNode: () => Array.from(store.get(WhiteboardAtom).nodes?.values() || []),
    getAllEdge: () => Array.from(store.get(WhiteboardAtom).edges?.values() || []),
    isFocused: includeInner => {
      if (includeInner === false) {
        return !!instance.values.isFocused
      }
      return !!instance.values.isFocused
    },
    setFocused: focused => {
      instance.values.isFocused = focused
    },
    addEventListener: (type, listener) => {
      const set = eventListeners.get(type) || new Set()
      set.add(listener)
      eventListeners.set(type, set)
    },
    emit: event => {
      eventListeners.get(event.type as any)?.forEach(l => l(event as WhiteboardEvent))
    },
    removeEventListener: (type, listener) => {
      eventListeners.get(type)?.delete(listener as any)
    },
    updateWhiteboard,
    insertNode: async (node, withUndo = false) => {
      const nodes = Array.isArray(node) ? node : [node]
      const normalizedNodes = nodes.map(n => ({
        z: 0,
        width: n.width,
        height: n.height,
        ...n,
        id: n.id ?? nextId()
      }))
      await updateWhiteboard(draft => {
        const collection = ensureMap(draft.nodes)
        normalizedNodes.forEach(n => {
          collection.set(n.id, {
            ...(collection.get(n.id) || {}),
            ...n
          })
        })
        draft.nodes = collection
      }, withUndo)
      return normalizedNodes as any
    }
  }

  instance.historyOps = {
    pushUpdates: ({ patches, inversePatches }) => {
      instance.historyOps?._pushInternal?.({ patches, inversePatches })
    },
    _pushInternal: ({ patches, inversePatches }) => undefined,
    undo: () => undefined,
    redo: () => undefined,
    canUndo: () => false,
    canRedo: () => false
  }

  instance.clipboardOps = {
    copy: selection => {
      const value = store.get(WhiteboardAtom)
      const nodeIds = new Set(selection.nodes)
      const nodes = Array.from(nodeIds).map(id => value.nodes?.get(id)).filter(Boolean) as any[]
      const edgesFromSelection = Array.from(selection.edges).map(id => value.edges?.get(id)).filter(Boolean) as any[]
      const edgesConnected =
        value.edges &&
        Array.from(value.edges.values()).filter(e => nodeIds.has(e.sourceId) && nodeIds.has(e.targetId))
      const edges = [...new Set([...(edgesFromSelection || []), ...(edgesConnected || [])])]
      adapter?.clipboard?.set?.({ type: 'mixed', nodes: nodes as any, edges: edges as any })
      instance.values.copiedElements = nodes
    },
    paste: async payload => {
      const data = payload ?? (await adapter?.clipboard?.get?.())
      if (!data) return
      const nodesPayload = data.type === 'nodes' || data.type === 'mixed' ? data.nodes ?? [] : []
      const edgesPayload = data.type === 'edges' || data.type === 'mixed' ? data.edges ?? [] : []
      const newNodeIds: number[] = []
      const newEdgeIds: number[] = []
      const idMap = new Map<number, number>()
      const OFFSET = 16
      await updateWhiteboard(draft => {
        const nodeCollection = ensureMap(draft.nodes)
        const edgeCollection = ensureMap(draft.edges)
        nodesPayload.forEach(n => {
          const id = nextGeneratedId()
          if (n.id !== undefined) {
            idMap.set(n.id, id)
          }
          nodeCollection.set(id, {
            ...n,
            id,
            x: (n.x ?? 0) + OFFSET,
            y: (n.y ?? 0) + OFFSET,
            z: n.z ?? 0
          } as any)
          newNodeIds.push(id)
        })
        edgesPayload.forEach(e => {
          const id = nextGeneratedId()
          edgeCollection.set(id, {
            ...e,
            id,
            sourceId: idMap.get(e.sourceId) ?? e.sourceId,
            targetId: idMap.get(e.targetId) ?? e.targetId
          } as any)
          newEdgeIds.push(id)
        })
        draft.nodes = nodeCollection
        draft.edges = edgeCollection
      }, true)
      if (newNodeIds.length || newEdgeIds.length) {
        instance.selectOps?.setSelection?.({
          nodes: new Set(newNodeIds),
          edges: new Set(newEdgeIds)
        })
      }
    },
    cut: selection => {
      instance.clipboardOps?.copy?.(selection)
      updateWhiteboard(draft => {
        selection.nodes.forEach(id => draft.nodes?.delete(id))
        selection.edges.forEach(id => draft.edges?.delete(id))
      }, true)
    }
  }

  assignHistoryOps(instance, store, onChange)
  assignCoordOps(instance, store)
  assignSelectionOps(instance, store)
  assignNodeOps(instance, store, updateWhiteboard)
  assignEdgeOps(instance, store, updateWhiteboard)
  assignLayoutOps(instance, store, updateWhiteboard)
  assignContainerOps(instance, store)

  store.set(WhiteboardInstanceAtom, instance)

  return { store, instance }
}
