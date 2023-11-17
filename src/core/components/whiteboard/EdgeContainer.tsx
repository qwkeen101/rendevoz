import { css } from '@emotion/css'
import AddingEdge from './AddingEdge'
import TreeEdge from './Edge'
import { useFlow, useWhiteboardEdges } from './hooks'
import useFreeHand from '@/core/components/whiteboard/freehand/useFreeHand'

const TreeEdgeContainer = () => {
  const treeEdges = useWhiteboardEdges()
  const flow = useFlow()
  const container = flow.parentContainerEle?.getBoundingClientRect()
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
      width={container?.width}
      height={container?.height}
      role="data-container"
    >
      <g>
        {Array.from(treeEdges.values()).map(edge => {
          return <TreeEdge key={edge.id} edge={edge} />
        })}
      </g>
      <AddingEdge />
    </svg>
  )
}

export default TreeEdgeContainer
