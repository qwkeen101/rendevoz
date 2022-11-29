import { Content } from '@/components/base'
import { PrettyInput } from '@/components/custom/input/pretty'
import produce from 'immer'
import useEdges from '../../hooks/useEdges'
import { GraphEdge } from '../../types/edge'

const EdgeAttributeCard = ({ currentEdge }: { currentEdge: GraphEdge }) => {
  const [edges, setEdges] = useEdges()

  const updateEdge = (edge: Partial<GraphEdge>) => {
    const originEdge = edges?.find(i => i.id === currentEdge.id)
    const newEdge = Object.assign({}, originEdge, edge)
    edges &&
      setEdges(
        produce(edges, draft => {
          const idx = draft?.findIndex(i => i.id === currentEdge.id)
          idx > -1 && (draft[idx] = newEdge)
        })
      )
  }
  return (
    <Content flex column style={{ padding: '8px 12px' }}>
      <PrettyInput
        value={edges?.find(i => i.id === currentEdge.id)?.label}
        onChange={e => {
          updateEdge({ label: e.target.value })
        }}
        displayText="Edge label"
      ></PrettyInput>
    </Content>
  )
}
export default EdgeAttributeCard
