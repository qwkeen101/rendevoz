import { MetaStore } from '@/api/stores'
import produce from 'immer'
import { atom, useAtom } from 'jotai'
import useEdges from './useEdges'
import { useGraphStaticNodes } from './useGraphNodes'
import { MetaFilterGroup } from '~/typings'
import { useUpdateEffect } from '@/hooks'

const EDGE_HIDDEN_ALPHA = 0.2

const EDGE_VISIBLE_ALPHA = 1

const GraphFilterAtom = atom<{
  hiddenTypes?: string[]
  highlightTags?: number[]
  filterRules?: MetaFilterGroup
  pinnedNodes?: number[]
  search?: string
  pointerEnterNodes?: number[]
}>({})
const useGraphFilter = () => {
  const [allNodes, setAllNodes] = useGraphStaticNodes()
  const [, setAllEdges] = useEdges()
  const [filterState, setFilter] = useAtom(GraphFilterAtom)

  const calculateFinalVisibleNodes = async () => {
    const { hiddenTypes, filterRules, search, pinnedNodes, pointerEnterNodes, highlightTags } = filterState
    const nodes = allNodes()
    let afterFilterObjects = filterRules?.rules.length
      ? new Set(
          (
            await Global.metaOps.filter(
              filterRules,
              nodes.map(i => i.id)
            )
          )?.map(i => i.id)
        )
      : undefined
    const afterSearchObjects = search
      ? new Set(
          (
            await Global.metaOps.search(
              search,
              nodes.map(i => i.id)
            )
          ).map(i => i.id)
        )
      : undefined
    const pinnedSet = new Set([...(pinnedNodes || []), ...(pointerEnterNodes || [])])
    if (pinnedSet.size) {
      // highlight pinned related as well
      const relatedMap = MetaStore.getIndexedMetaLinks().relatedIdsMap
      const extraPinnedNodes: number[] = []
      pinnedSet.forEach(pinnedId => {
        relatedMap.get(pinnedId)?.forEach(id => {
          extraPinnedNodes.push(id)
        })
      })
      extraPinnedNodes.forEach(id => {
        pinnedSet.add(id)
      })
    }
    const hiddenTypeSet = new Set(hiddenTypes)
    const highlightTagSet = new Set(highlightTags)
    const visible = nodes.filter(node => {
      const id = node.id
      const m = MetaStore.getCachedMetaObject(id)
      if (!m || m.deleted) return false
      if (pinnedSet.has(id)) return true
      if (highlightTagSet.size) {
        if (m.tags?.some(i => highlightTagSet.has(i))) return true
        return false
      }
      if (hiddenTypeSet.size) {
        if (hiddenTypeSet.has(m.type)) {
          return false
        }
      }
      if (afterFilterObjects) {
        if (afterFilterObjects.has(id)) {
          return true
        }
        return false
      }
      if (afterSearchObjects) {
        if (afterSearchObjects.has(id)) {
          return true
        }
        return false
      }
      return true
    })
    return visible
  }
  const handleNodePointerEnter = (nodeId: number) => {
    setFilter(f => ({
      ...f,
      pointerEnterNodes: f.pointerEnterNodes?.includes(nodeId) ? f.pointerEnterNodes : [...(f.pointerEnterNodes || []), nodeId]
    }))
  }

  const handleNodePointerLeave = () => {
    setFilter(f => ({
      ...f,
      pointerEnterNodes: undefined
    }))
  }

  const triggerGraphChange = (visibleNodes: number[], turnNormal?: boolean) => {
    // must highlight
    const shouldHighlightNodesIds = new Set<number>(visibleNodes)
    // one condition: has highlight
    if (!turnNormal) {
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
  }
  useUpdateEffect(() => {
    calculateFinalVisibleNodes().then(res => {
      if (res.length === allNodes().length) {
        triggerGraphChange(
          res.map(i => i.id),
          true
        )
      } else {
        triggerGraphChange(res.map(i => i.id))
      }
    })
  }, [filterState])
  return {
    handleNodePointerEnter,
    handleNodePointerLeave
  }
}

useGraphFilter.atom = GraphFilterAtom

export default useGraphFilter as typeof useGraphFilter & {
  atom: typeof GraphFilterAtom
}
