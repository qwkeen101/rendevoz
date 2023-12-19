import { css } from '@emotion/css'
import EdgeOverlay from './EdgeOverlay'
import TreeEdge from './Edge'
import { useFlow, useWhiteboardEdges } from '../StateHooks'
import { useEffect } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'

const TreeEdgeContainer = () => {
  const treeEdges = useWhiteboardEdges()
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  const container = flow.parentContainerEle?.getBoundingClientRect()
  useEffect(() => {
    instance.buildNodeToEdgeIndex?.()
  }, [treeEdges])
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
      <EdgeOverlay />
    </svg>
  )
}

export default TreeEdgeContainer
