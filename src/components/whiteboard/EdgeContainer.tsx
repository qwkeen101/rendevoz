import { css } from '@emotion/css'
import SvgMarker from '../svg/Marker'
import SvgFilter from '../svg/Filter'
import AddingEdge from './AddingEdge'
import TreeEdge from './Edge'
import { useWhiteboardEdges } from './hooks'
const TreeEdgeContainer = () => {
  const treeEdges = useWhiteboardEdges()

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
      <SvgFilter />
      {/* <SvgMarker /> */}
      {Array.from(treeEdges.values()).map(edge => {
        return <TreeEdge key={edge.id} edge={edge} />
      })}
      <AddingEdge />
    </svg>
  )
}

export default TreeEdgeContainer
