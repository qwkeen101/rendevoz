import Actions from '@/core/Actions'
import { ObjectActionPopover, useRenderObject } from '@/core/database'
import { GlobalGraphInstance, getAllEdgesOfNodes, getRelatedNodesOfNode } from '../..'
import useGraph from '../../hooks/useGraph'
import { Content } from '@/components'
import { useAtom } from 'jotai'
import { GraphPinNodesIdsAtom } from '../../hooks/useGraphFilter'
import produce from 'immer'
import FontSize from '@/consts/font'
import { useMemo } from 'react'
import { globalStore } from '@/stores'
import { relatedMetaObjectsMapAtom } from '@/stores/meta.store'
import useGraphNodes from '../../hooks/useGraphNodes'
import useEdges from '../../hooks/useEdges'
import * as d3 from 'd3'
const NodePopover = ({ metaId, nodeId, onClose }: { metaId: number; nodeId: number; onClose: VoidFunction }) => {
  const { renderWhole } = useRenderObject({ metaObjectId: metaId })
  const graph = useGraph()
  const [pinnedIds, setPinnedIds] = useAtom(GraphPinNodesIdsAtom)
  const [, setNodes] = useGraphNodes()
  const [, setEdges] = useEdges()
  const { canExpand, relatedNum } = useMemo(() => {
    const relatedIds = globalStore.get(relatedMetaObjectsMapAtom).get(nodeId)
    const graphNodes = graph?.nodesMap
    let can = false
    let related = 0

    relatedIds?.forEach(id => {
      if (!graphNodes?.has(id)) {
        can = true
        related += 1
      }
    })
    return {
      canExpand: can,
      relatedNum: related
    }
  }, [nodeId])
  return (
    <Content flex gap={12} alignItems="flex-start">
      {renderWhole({
        titleOptions: {
          style: {
            fontSize: FontSize['14px']
          },
          onTitleClick: () => {
            Actions.navigateToTargetObject(metaId)
            GlobalGraphInstance.minimize?.()
            graph?.overlayManager?.close()
          }
        },
        descriptionOptions: {
          style: {
            fontSize: FontSize['13px']
          },
          ellipsisLine: 8
        },
        mainContainerStyle: {
          padding: 10
        },
        rowGap: 5,
        renderOptions: {
          renderImage: true,
          imageMode: 'whole',
          renderFrom: true,
          renderOption: true
        },
        optionOptions: {
          customNode: (
            <ObjectActionPopover
              metaObjectId={metaId}
              onEdit={() => onClose()}
              onShowRelated={() => {
                // after get related nodes, we need to
                const nodes = getRelatedNodesOfNode(nodeId)

                const centerNode = graph?.nodesMap?.get(nodeId)
                const originNodes = graph?.originNodes
                const edges = getAllEdgesOfNodes(new Set([...nodes.map(i => i.id), ...(originNodes?.map(i => i.id) || [])]))
                if (graph) {
                  graph.originEdges = null
                  graph.originNodes = null
                }
                setEdges(e => {
                  const currentEdges = new Map(edges.map(i => [i.id, i]))
                  e?.forEach(i => currentEdges.set(i.id, i))
                  const nextEdges = Array.from(currentEdges.values())
                  graph?.registerEdges(nextEdges)
                  return nextEdges
                })
                setNodes(n => {
                  const currentNodes = new Map(nodes.map(i => [i.id, i]))
                  n?.forEach(i => currentNodes.set(i.id, i))

                  originNodes?.forEach(i =>
                    currentNodes.set(i.id, {
                      ...currentNodes.get(i.id),
                      fx: i.x,
                      fy: i.y
                    })
                  )
                  const nextNodes = Array.from(currentNodes.values())
                  graph?.registerNodes(nextNodes)
                  return nextNodes
                })
                setTimeout(() => {
                  if (graph?.d3Simulation) {
                    graph.d3Simulation = graph.d3Simulation
                      .nodes(graph.originNodes.filter(i => !i.hidden))
                      .force('center', d3.forceCenter(centerNode?.x, centerNode?.y).strength(0.005))
                      .force(
                        'link',
                        d3
                          .forceLink(graph.originEdges?.filter(i => !i.hidden))
                          .id(d => d.id)
                          .distance(300)
                      )
                      .alpha(1)
                      .alphaTarget(0)
                      .on('tick', graph.ticked)
                      .restart()
                  }
                }, 0)
              }}
              onGraphPin={() => {
                setPinnedIds(p =>
                  produce(p, draft => {
                    draft.has(nodeId) ? draft.delete(nodeId) : draft.add(nodeId)
                  })
                )
              }}
              visibility={{
                graphPinVisible: true,
                showRelatedVisible: canExpand,
                graphPinned: pinnedIds.has(nodeId),
                relatedNum: relatedNum
              }}
            />
          )
        }
      })}
    </Content>
  )
}

export default NodePopover
