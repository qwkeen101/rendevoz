import { css } from '@emotion/css'
import EdgeOverlay from './EdgeOverlay'
import TreeEdge from './Edge'
import { useFlow, useWhiteboardEdges } from '../StateHooks'
import { useEffect, useRef } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'

const clazz = css({
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})
const TreeEdgeContainer = () => {
  const treeEdges = useWhiteboardEdges()
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  const edgeLayerRef = useRef<SVGGElement>(null)
  const edgeLabelLayerRef = useRef<SVGGElement>(null)
  instance.getEdgeLayer = () => edgeLayerRef.current
  instance.getEdgeLabelLayer = () => edgeLabelLayerRef.current
  const container = flow.parentContainerEle?.getBoundingClientRect()
  useEffect(() => {
    instance.buildNodeToEdgeIndex?.()
  }, [treeEdges])
  return (
    <>
      <svg className={clazz} width={container?.width} height={container?.height} role="data-container">
        <g ref={edgeLayerRef}>
          {Array.from(treeEdges.values()).map(edge => {
            return <TreeEdge key={edge.id} edge={edge} />
          })}
        </g>
        <EdgeOverlay />
      </svg>
      <svg className={clazz} ref={edgeLabelLayerRef} width={container?.width} height={container?.height} role="data-container"></svg>
    </>
  )
}

export default TreeEdgeContainer
