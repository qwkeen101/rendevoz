import { memo } from 'react'
import useEdges from '../hooks/useEdges'
import { Container } from '@pixi/react'
import PixiEdge from '@/core/components/graph/components/PixiEdge'

const EdgeContainer = () => {
  const [edges] = useEdges()
  return (
    <Container position={[0, 0]} sortableChildren={true}>
      {edges?.map(e => <PixiEdge edge={e} key={e.id} />)}
    </Container>
  )
}
export default memo(EdgeContainer)
