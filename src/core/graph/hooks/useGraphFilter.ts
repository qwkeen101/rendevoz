import { useObjectFilter } from '@/core'
import { globalStore } from '@/stores'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import produce from 'immer'
import { atom, useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import useEdges from './useEdges'
import useGraphNodes from './useGraphNodes'

export const GraphPinNodesIdsAtom = atom(new Set<number>())

export const GraphTagsAtom = atom(new Set<string>())

export const GraphHideNodesIdsAtom = atom(new Set<number>())

export const GraphVisibleNodesIdsAtom = atom<number[]>([])
const useGraphFilter = () => {
  const [allNodes, setAllNodes] = useGraphNodes()
  const [, setAllEdges] = useEdges()
  const setGraphVisibleNodesIds = useSetAtom(GraphVisibleNodesIdsAtom)
  const store = useStore()

  const allNodesIdSet = useMemo(() => new Set(allNodes?.map(i => i.id)), [allNodes?.length])

  const nodesVisibilityState = useRef({
    afterFilterNodesIds: new Set<number>(),
    pinnedNodesIds: new Set<number>(),
    hideNodesIds: new Set<number>(),
    pointerEnterNodesIds: new Set<number>()
  })

  useObjectFilter(
    ids => {
      nodesVisibilityState.current.afterFilterNodesIds = ids
      triggerGraphChange()
    },
    store,
    allNodesIdSet
  )
  const pinnedNodesIds = useAtomValue(GraphPinNodesIdsAtom)
  const hideNodesIds = useAtomValue(GraphHideNodesIdsAtom)

  useEffect(() => {
    nodesVisibilityState.current = {
      ...nodesVisibilityState.current,
      pinnedNodesIds,
      hideNodesIds
    }
    triggerGraphChange()
  }, [pinnedNodesIds, hideNodesIds])

  const handleNodePointerEnter = (nodeId: number) => {
    const relatedMap = globalStore.get(relatedMetaObjectsMapAtom)
    const nodeRelated = structuredClone(relatedMap.get(nodeId)) as Set<number>
    nodeRelated.add(nodeId)
    nodeRelated.forEach(id => nodesVisibilityState.current.pointerEnterNodesIds.add(id))
    triggerGraphChange()
  }

  const handleNodePointerLeave = () => {
    nodesVisibilityState.current.pointerEnterNodesIds.clear()
    triggerGraphChange()
  }

  const triggerGraphChange = () => {
    const { pinnedNodesIds, afterFilterNodesIds, hideNodesIds, pointerEnterNodesIds } = nodesVisibilityState.current

    const relatedMap = globalStore.get(relatedMetaObjectsMapAtom)
    const shouldHighlightNodesIds = new Set<number>()

    pinnedNodesIds.forEach(pinnedId => {
      shouldHighlightNodesIds.add(pinnedId)
      relatedMap.get(pinnedId)?.forEach(id => shouldHighlightNodesIds.add(id))
    })
    const hasFilter = afterFilterNodesIds.size !== allNodes?.length

    if (hasFilter) {
      afterFilterNodesIds.forEach(id => shouldHighlightNodesIds.add(id))
    }

    hideNodesIds.forEach(id => shouldHighlightNodesIds.delete(id))

    const hasShouldHighlight = shouldHighlightNodesIds.size > 0

    const visibleNodes = hasShouldHighlight ? Array.from(shouldHighlightNodesIds) : Array.from(afterFilterNodesIds)
    pointerEnterNodesIds.forEach(id => {
      shouldHighlightNodesIds.add(id)
    })

    // one condition: has highlight
    if (hasShouldHighlight) {
      setAllNodes(nodes =>
        nodes
          ? produce(nodes, draft => {
              nodes.forEach((node, idx) => {
                if (shouldHighlightNodesIds.has(node.id)) {
                  node.opacity !== 1 && (draft[idx].opacity = 1)
                } else {
                  node.opacity === 1 && (draft[idx].opacity = 0.1)
                }
              })
            })
          : nodes
      )
      setAllEdges(edges =>
        edges
          ? produce(edges, draft => {
              edges.forEach((edge, idx) => {
                if (shouldHighlightNodesIds.has(edge.targetId) && shouldHighlightNodesIds.has(edge.sourceId)) {
                  edge.opacity !== 1 && (draft[idx].opacity = 1)
                  !edge.highlight && (draft[idx].highlight = true)
                } else {
                  edge.opacity === 1 && (draft[idx].opacity = 0)
                  edge.highlight && (draft[idx].highlight = false)
                }
              })
            })
          : edges
      )
      // no highlight, make all nodes and edges to normal
    } else {
      setAllNodes(nodes =>
        nodes
          ? produce(nodes, draft => {
              nodes.forEach((node, idx) => {
                node.opacity !== 1 && (draft[idx].opacity = 1)
              })
            })
          : nodes
      )
      setAllEdges(edges =>
        edges
          ? produce(edges, draft => {
              edges.forEach((edge, idx) => {
                edge.opacity !== 1 && (draft[idx].opacity = 1)
                edge.highlight && (draft[idx].highlight = false)
              })
            })
          : edges
      )
    }
    setGraphVisibleNodesIds(visibleNodes)
  }

  return {
    handleNodePointerEnter,
    handleNodePointerLeave
  }
}

export default useGraphFilter
