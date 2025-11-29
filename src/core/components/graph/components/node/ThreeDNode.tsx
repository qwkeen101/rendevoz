import { GraphNode } from '@/core/components/graph/types/node'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { MetaStore } from '@/api/stores'
import {} from '@react-three/fiber'
import { selectAtom } from 'jotai/utils'
import { GlobalSetting } from '@/core'
import { isEqual } from 'lodash'
import { Text } from '@react-three/drei'
const selectedAtom = selectAtom(
  GlobalSetting.settingAtom,
  s => ({
    nodeSize: s.graph.nodeSize,
    nodeColor: s.graph.nodeColor
  }),
  isEqual
)
export default ({ node }: { node: GraphNode }) => {
  const graph = useGraph()
  const meta = MetaStore.useValue(node.id)
  const { x, y, z } = node
  if (meta && !meta.deleted && x !== undefined && y !== undefined && z !== undefined) {
    return (
      <mesh position={[x, y, z]}>
        <circleGeometry />
        <Text>{meta.name || meta.placeholderName}</Text>
      </mesh>
    )
  }
}
