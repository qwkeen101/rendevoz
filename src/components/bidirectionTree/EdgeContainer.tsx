import { css } from '@emotion/css'
import SvgMarker from '../svg/Marker'
import TreeEdge from './Edge'
import { useTreeEdges } from './hooks'
const TreeEdgeContainer = () => {
  const treeEdges = useTreeEdges()

  return (
    <svg
      className={css({
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'visible',
        pointerEvents: 'none'
      })}
      role="data-container"
    >
      <SvgMarker />
      {Array.from(treeEdges.values()).map(edge => {
        return <TreeEdge id={edge.id} key={edge.id} sourceId={edge.sourceId} targetId={edge.targetId} />
      })}
    </svg>
  )
}

export default TreeEdgeContainer
