import { usePrevious } from '@/hooks'
import { css } from '@emotion/css'
import { memo, useEffect } from 'react'
import { MarkerColor } from '../consts/markerColors'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import { getMarkerId } from '../utils/getMarkerId'
import Edge from './Edge'

const svgContainerClassName = css({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})
const EdgeContainer = () => {
  const graph = useGraph()
  const [edges] = useEdges()

  const previousEdges = usePrevious(edges)

  useEffect(() => {
    if (previousEdges && edges && graph) {
      if (previousEdges?.length !== edges?.length) {
        const oppoMap = new Map()
        graph.originEdges?.forEach(e => {
          const oppositeEdge = graph.originEdges?.find(i => i.targetId === e.sourceId && i.sourceId === e.targetId)
          if (oppositeEdge) {
            oppoMap.set(e.id, oppositeEdge)
            oppoMap.set(oppositeEdge.id, e)
          }
        })
        graph.oppositeEdgesMap = oppoMap
      }
    }
  }, [edges])

  return (
    <svg viewBox="-300 -300 600 600" className={svgContainerClassName}>
      <defs>
        {(Object.values(MarkerColor) as string[]).map(color => (
          <marker
            refX={0}
            refY={0}
            markerUnits="strokeWidth"
            viewBox="-10,-10,20,20"
            orient="auto"
            key={color}
            id={getMarkerId('end', color)}
            markerWidth={12.5}
            markerHeight={12.5}
          >
            <polyline
              stroke={color}
              fill={color}
              strokeWidth={1}
              points="-5,-4 0,0 -5,4 -5,-4"
              strokeLinejoin="round"
              strokeLinecap="round"
            ></polyline>
          </marker>
        ))}
      </defs>
      {edges
        ?.filter(i => !i.hidden)
        ?.map(edge => (
          <Edge edge={edge} key={`${edge.id}`} />
        ))}
    </svg>
  )
}
export default memo(EdgeContainer)
