import GraphContainer from '@/components/graph/components/GraphContainer'
import { GraphEdge } from '@/components/graph/types/edge'
import { GraphNode } from '@/components/graph/types/node'
import useMetaStore from '@/stores/meta.store'
import { useEffect, useState } from 'react'

const Graph = () => {
  const { allMetaLinks, allMetaObjects } = useMetaStore()
  const [nodes, setNodes] = useState()
  const [edges, setEdges] = useState()
  useEffect(() => {
    if (!nodes && !edges) {
      const _nodes: GraphNode[] = allMetaObjects.map(i => ({
        id: i.id,
        type: i.type,
        label: i.keyword || i.title || i.name
      }))
      const nodeIds = new Set()
      _nodes.forEach(n => nodeIds.add(n.id))
      const _edges: GraphEdge[] = allMetaLinks.filter(i => nodeIds.has(i.sourceId) && nodeIds.has(i.targetId))
      setEdges(_edges)
      setNodes(_nodes)
    }
  }, [allMetaLinks, allMetaObjects])
  return <GraphContainer nodes={nodes} edges={edges} />
}

export default Graph
