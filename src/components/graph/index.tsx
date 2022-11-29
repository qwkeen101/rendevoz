import useMetaStore from '@/stores/meta.store'
import GraphContainer from './components/GraphContainer'
import { GraphEdge } from './types/edge'
import { GraphNode } from './types/node'

export const GraphTest = () => {
  const { allMetaObjects, allMetaLinks } = useMetaStore()
  const nodes: GraphNode[] = allMetaObjects.slice(0, 20).map(i => {
    return {
      id: i.id,
      label: i.keyword,
      coverImgSrc: i.coverImgSrc
    }
  })
  const edges: GraphEdge[] = allMetaLinks.slice(0, 20).map(i => {
    return {
      id: i.id,
      sourceId: i.sourceId,
      targetId: i.targetId,
      label: i.label
    }
  })
  return (
    <>
      <GraphContainer edges={edges} nodes={nodes} />
    </>
  )
}
