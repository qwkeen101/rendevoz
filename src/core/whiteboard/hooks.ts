import { useAtom, useAtomValue, useSetAtom } from 'jotai/react'
import { atom, SetStateAction } from 'jotai/vanilla'
import FlowManager from './FlowManager'
import { EdgePosition, IWhiteboard, IWhiteboardEdge, IWhiteboardNode } from '../../../typings/data/whiteboard'
import { Box } from '~/typings'
import { selectAtom } from 'jotai/utils'
import { ICollectionItem } from '~/typings/data'
import { ObjectStore } from '@/stores'

const WhiteboardNodesAtom = atom(
  get => {
    const nodes = get(WhiteboardSelectNodesAtom)
    return nodes || new Map<number, IWhiteboardNode>()
  },
  (get, set, update: SetStateAction<Map<number, IWhiteboardNode>>) => {
    const whiteboard = get(WhiteboardAtom)
    const nextItem = typeof update === 'function' ? update(get(WhiteboardNodesAtom) || new Map()) : update
    if (whiteboard) {
      ObjectStore('whiteboard').updateOne(
        {
          id: whiteboard.id,
          nodes: nextItem
        },
        { silent: true }
      )
    }
  }
)

const WhiteboardEdgesAtom = atom(
  get => {
    const edges = get(WhiteboardSelectEdgesAtom)
    return edges || new Map()
  },
  (get, set, update: SetStateAction<Map<number, IWhiteboardEdge>>) => {
    const whiteboard = get(WhiteboardAtom)
    const nextItem = typeof update === 'function' ? update(get(WhiteboardEdgesAtom) || new Map()) : update
    if (whiteboard) {
      ObjectStore('whiteboard').updateOne(
        {
          id: whiteboard.id,
          edges: nextItem
        },
        { silent: true }
      )
    }
  }
)

const WhiteboardItemsAtom = atom(
  get => {
    const items = get(WhiteboardSelectItemsAtom)
    return items || []
  },
  (get, set, update: SetStateAction<ICollectionItem[]>) => {
    const whiteboard = get(WhiteboardAtom)
    const nextItem = typeof update === 'function' ? update(get(WhiteboardItemsAtom) || []) : update
    if (whiteboard) {
      ObjectStore('whiteboard').updateOne(
        {
          id: whiteboard.id,
          items: nextItem
        },
        { silent: true }
      )
    }
  }
)
export const WhiteboardAtom = atom<IWhiteboard | undefined>(undefined)

const WhiteboardSelectNodesAtom = selectAtom(WhiteboardAtom, w => w?.nodes)

const WhiteboardSelectEdgesAtom = selectAtom(WhiteboardAtom, w => w?.edges)

const WhiteboardSelectItemsAtom = selectAtom(WhiteboardAtom, w => w?.items)

const IsAddingEdgeAtom = atom<{
  isAdding: boolean
  targetNodeId?: number
  sourceNodeId?: number
  targetPosition?: EdgePosition
  sourcePosition?: EdgePosition
}>({
  isAdding: false
})
const WhiteboardSelectStateAtom = atom<{
  isSelecting: boolean
  selectArea?: Box
}>({
  isSelecting: false
})

export const useWhiteboardSelectState = () => useAtom(WhiteboardSelectStateAtom)

export const FlowAtom = atom<FlowManager>(new FlowManager())

export const useWhiteboardNodes = () => useAtomValue(WhiteboardNodesAtom)

export const useSetWhiteboardNodes = () => useSetAtom(WhiteboardNodesAtom)

export const useWhiteboardEdges = () => useAtomValue(WhiteboardEdgesAtom)

export const useAddingEdges = () => useAtom(IsAddingEdgeAtom)

export const useSetWhiteboardEdges = () => useSetAtom(WhiteboardEdgesAtom)

export const useSetWhiteboardItems = () => useSetAtom(WhiteboardItemsAtom)

export const useFlow = () => useAtomValue(FlowAtom)
