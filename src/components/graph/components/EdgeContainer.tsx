import { useMemoizedFn, usePrevious } from '@/hooks'
import { css } from '@emotion/css'
import produce from 'immer'
import { FC, memo, useEffect, useLayoutEffect } from 'react'
import { MarkerColor } from '../consts/markerColors'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import { GraphEdge } from '../types/edge'
import { getMarkerId } from '../utils/getMarkerId'
import Edge from './Edge'

interface EdgeContainerProps {}
const svgContainerClassName = css({
  position: 'absolute',
  left: 0,
  top: 0,
  width: '100%',
  height: '100%',
  overflow: 'visible',
  pointerEvents: 'none'
})
const EdgeContainer: FC<EdgeContainerProps> = () => {
  const graph = useGraph()
  const [edges, setEdges] = useEdges()
  const previousEdges = usePrevious(edges)

  useEffect(() => {
    graph?.registerHandler('change', changeHandler)
  }, [])
  const changeHandler = useMemoizedFn((_, _edges: GraphEdge[]) => {
    if (edges && graph) {
      const oppoMap = new Map()
      graph.originEdges?.forEach(e => {
        const oppositeEdge = graph.originEdges?.find(i => i.targetId === e.sourceId && i.sourceId === e.targetId)
        if (oppositeEdge) {
          oppoMap.set(e.id, oppositeEdge)
          oppoMap.set(oppositeEdge.id, e)
        }
      })
      graph.oppositeEdgesMap = oppoMap

      setEdges(
        produce(edges, draft => {
          _edges.forEach(e => {
            const idx = edges?.findIndex(o => o.id === e.id)
            if (idx > -1) {
              draft[idx] = Object.assign({}, edges[idx], e)
            } else {
              draft.push(e)
            }
          })
          if (_edges.length < edges.length) {
            edges.forEach(n => {
              if (!_edges.some(o => o.id === n.id)) {
                const idx = draft.findIndex(o => o.id === n.id)
                idx !== -1 && draft.splice(idx, 1)
              }
            })
          }
        })
      )
    }
  })
  return (
    <svg viewBox="-300 -300 600 600" className={svgContainerClassName}>
      <defs>
        {Object.values(MarkerColor).map(color => (
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
      {edges?.map(edge => (
        <Edge edge={edge} key={`${edge.sourceId}_${edge.targetId}`} />
      ))}
    </svg>
  )
}
export default EdgeContainer
