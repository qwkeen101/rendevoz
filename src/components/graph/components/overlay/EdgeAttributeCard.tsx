import { Content } from '@/components/base'
import { PrettyInput } from '@/components/custom/input/pretty'
import { useDebounceFn } from '@/hooks'
import useMetaStore from '@/stores/meta.store'
import { css } from '@emotion/css'
import produce from 'immer'
import useEdges from '../../hooks/useEdges'
import { GraphEdge } from '../../types/edge'

const EdgeAttributeCard = ({ currentEdge }: { currentEdge: GraphEdge }) => {
  const [edges, setEdges] = useEdges()
  const { updateMetaLink } = useMetaStore()

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
    updateMetaLink({
      id: currentEdge.id,
      label: edge.label
    })
  }
  const { run: debouncedUpdateEdge } = useDebounceFn(updateEdge, { wait: 200 })
  return (
    <Content flex column style={{ padding: '12px 16px', width: 250 }}>
      <div
        className={css({
          fontWeight: 600,
          fontSize: 18,
          marginBottom: 20
        })}
      >
        Edge setting
      </div>
      <PrettyInput
        value={edges?.find(i => i.id === currentEdge.id)?.label}
        onChange={e => {
          debouncedUpdateEdge({ label: e.target.value })
        }}
        displayText="Edge label"
      ></PrettyInput>
    </Content>
  )
}
export default EdgeAttributeCard
