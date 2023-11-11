import { useObjectFilter } from '@/core'
import { globalStore } from '@/stores'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import produce from 'immer'
import { atom, useAtom, useAtomValue, useSetAtom, useStore } from 'jotai'
import { useEffect, useMemo, useRef } from 'react'
import useEdges from './useEdges'
import useGraphNodes from './useGraphNodes'
import { GraphPathFilterAtom } from '../components/GraphPathFilter'
import { findPathsBetweenTwoMetaObjects } from '../utils/findPathsBetweenTwoNodes'

export const GraphPinNodesIdsAtom = atom(new Set<number>())

export const GraphTagsAtom = atom(new Set<string>())

export const GraphHideNodesIdsAtom = atom(new Set<number>())

const EDGE_HIDDEN_ALPHA = 0.05

const EDGE_VISIBLE_ALPHA = 1

export const GraphVisibleNodesIdsAtom = atom<number[]>([])
export const GraphFilterNodesIdsAtom = atom<number[]>([])
const useGraphFilter = () => {
  const [allNodes, setAllNodes] = useGraphNodes()
  const [, setAllEdges] = useEdges()

  const setGraphVisibleNodesIds = useSetAtom(GraphVisibleNodesIdsAtom)
  const graphFilterNodes = useAtomValue(GraphFilterNodesIdsAtom)

  const nodesVisibilityState = useRef({
    afterFilterNodesIds: new Set<number>(),
    pinnedNodesIds: new Set<number>(),
    hideNodesIds: new Set<number>(),
    pointerEnterNodesIds: new Set<number>(),
    pathFilterNodeIds: new Set<number>()
  })
  useEffect(() => {
    nodesVisibilityState.current.afterFilterNodesIds = new Set([...graphFilterNodes])
    triggerGraphChange()
  }, [graphFilterNodes])

  const pinnedNodesIds = useAtomValue(GraphPinNodesIdsAtom)
  const hideNodesIds = useAtomValue(GraphHideNodesIdsAtom)
  const [pathFilter, setPathFilter] = useAtom(GraphPathFilterAtom)
  useEffect(() => {
    if (pathFilter?.startNodeId && pathFilter.endNodeId) {
      const { startNodeId, endNodeId } = pathFilter
      const allPaths = findPathsBetweenTwoMetaObjects(startNodeId, endNodeId)
      setPathFilter(f => ({ ...f, allPaths, visiblePath: allPaths }))
    } else {
      setPathFilter(f => ({
        ...f,
        allPaths: undefined,
        visiblePath: undefined,
        filteredNodeIds: new Set()
      }))
    }
  }, [pathFilter?.startNodeId, pathFilter?.endNodeId])

  useEffect(() => {
    if (pathFilter?.allPaths?.length) {
      if (pathFilter?.showShortest) {
        const copyed = pathFilter.allPaths.slice().sort((b, a) => b.length - a.length)
        const shortest = copyed[0] || []
        setPathFilter(f => ({ ...f, visiblePath: [shortest] }))
      } else {
        setPathFilter(f => ({ ...f, visiblePath: f?.allPaths }))
      }
    }
  }, [pathFilter?.allPaths, pathFilter?.showShortest])
  useEffect(() => {
    if (pathFilter?.visiblePath?.length) {
      const { visiblePath } = pathFilter
      const nodeIds = new Set<number>()
      visiblePath.map(path => {
        path.forEach(nodeId => {
          nodeIds.add(nodeId)
        })
      })
      setPathFilter(f => ({ ...f, filteredNodeIds: nodeIds }))
    } else {
      setPathFilter(f => ({ ...f, filteredNodeIds: new Set() }))
    }
  }, [pathFilter?.visiblePath?.length])

  useEffect(() => {
    setPathFilter(f => ({
      ...f,
      visiblePath: f?.allPaths?.filter(i => i.length <= (pathFilter?.maxPathLength || Number.MAX_SAFE_INTEGER) + 1)
    }))
  }, [pathFilter?.maxPathLength, pathFilter?.allPaths?.length])
  useEffect(() => {
    nodesVisibilityState.current = {
      ...nodesVisibilityState.current,
      pinnedNodesIds,
      hideNodesIds,
      pathFilterNodeIds: pathFilter?.filteredNodeIds || nodesVisibilityState.current.pathFilterNodeIds
    }
    console.log(pathFilter?.filteredNodeIds)
    triggerGraphChange()
  }, [pinnedNodesIds, hideNodesIds, pathFilter?.filteredNodeIds])

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
    const { pinnedNodesIds, afterFilterNodesIds, hideNodesIds, pointerEnterNodesIds, pathFilterNodeIds } = nodesVisibilityState.current

    const relatedMap = globalStore.get(relatedMetaObjectsMapAtom)
    // must highlight
    const shouldHighlightNodesIds = new Set<number>()
    // can be hiden if have filters
    const pinnedRelatedNodesIds = new Set<number>()
    pinnedNodesIds.forEach(pinnedId => {
      shouldHighlightNodesIds.add(pinnedId)
      // relatedMap.get(pinnedId)?.forEach(id => shouldHighlightNodesIds.add(id))
      relatedMap.get(pinnedId)?.forEach(id => {
        pinnedRelatedNodesIds.add(id)
        // maybe deleted if filtered out
        shouldHighlightNodesIds.add(id)
      })
    })
    const hasFilter = afterFilterNodesIds.size !== allNodes?.length
    const hasPathFilter = pathFilterNodeIds.size > 0
    if (hasFilter) {
      afterFilterNodesIds.forEach(id => {
        shouldHighlightNodesIds.add(id)
      })
      pinnedRelatedNodesIds.forEach(id => {
        if (!afterFilterNodesIds.has(id) && !pinnedNodesIds.has(id)) {
          shouldHighlightNodesIds.delete(id)
        }
      })
    }

    // maybe should preserve pinned related nodes when we filter paths?
    if (hasPathFilter) {
      pathFilterNodeIds.forEach(id => shouldHighlightNodesIds.add(id))
    }

    hideNodesIds.forEach(id => shouldHighlightNodesIds.delete(id))

    const hasShouldHighlight = shouldHighlightNodesIds.size > 0

    const visibleNodes = hasShouldHighlight ? Array.from(shouldHighlightNodesIds) : Array.from(afterFilterNodesIds)
    pointerEnterNodesIds.forEach(id => {
      shouldHighlightNodesIds.add(id)
    })
    console.log(hasShouldHighlight)
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
                  edge.opacity !== EDGE_VISIBLE_ALPHA && (draft[idx].opacity = EDGE_VISIBLE_ALPHA)
                  !edge.highlight && (draft[idx].highlight = true)
                } else {
                  edge.opacity === EDGE_VISIBLE_ALPHA && (draft[idx].opacity = EDGE_HIDDEN_ALPHA)
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
                edge.opacity !== EDGE_VISIBLE_ALPHA && (draft[idx].opacity = EDGE_VISIBLE_ALPHA)
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
