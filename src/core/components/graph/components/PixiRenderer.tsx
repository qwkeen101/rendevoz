import { useApp } from '@pixi/react'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { useEffect, useRef } from 'react'
import { FederatedPointerEvent } from 'pixi.js'

const PixiRenderer = () => {
  const graph = useGraph()
  const simuRestarted = useRef(false)
  const dragTimer = useRef(0)
  const appMouseMoveHandler = (e: FederatedPointerEvent) => {
    // drag
    if (graph?.currentClickNodeId) {
      if (dragTimer.current === 0) {
        dragTimer.current = Date.now()
      }
      if (Date.now() - dragTimer.current < 100) {
        return
      }
      graph.isDragging = true
      if (!simuRestarted.current) {
        simuRestarted.current = true
        graph.d3Simulation?.alphaTarget(0.3)
        graph.d3Simulation?.restart()
      }
      const pixiNode = graph.ID_TO_PIXI_NODE_MAP.get(graph.currentClickNodeId)
      if (pixiNode) {
        const point = graph?.pixiViewport?.toWorld(e.global)
        if (point) {
          const bound = pixiNode.children[0].getLocalBounds()
          const nextX = point.x
          const nextY = point.y
          pixiNode.x = nextX
          pixiNode.y = nextY
          const d3Node = graph.d3Simulation?.nodes().find(i => i.id === graph.currentClickNodeId)
          if (d3Node) {
            d3Node.fx = nextX - bound.width / 2
            d3Node.fy = nextY - bound.height / 2
          }
        }
      }
    }
  }
  const appMouseUpHandler = (e: FederatedPointerEvent) => {
    if (graph) {
      setTimeout(() => {
        graph.currentClickNodeId = undefined
        graph.currentClickEdgeId = undefined
      }, 50)
      if (graph?.pixiViewport) {
        graph.pixiViewport.pause = false
      }
      dragTimer.current = 0
      if (simuRestarted.current) {
        graph?.d3Simulation?.alphaTarget(0)
        simuRestarted.current = false
        const d3Node = graph.d3Simulation?.nodes().find(i => i.id === graph.currentClickNodeId)
        if (d3Node) {
          d3Node.fx = null
          d3Node.fy = null
        }
      }
      setTimeout(() => {
        graph.isDragging = false
      })
    }
  }
  useEffect(() => {
    graph?.pixiViewport?.addListener('mousemove', appMouseMoveHandler)
    graph?.pixiViewport?.addListener('mouseup', appMouseUpHandler)
    return () => {
      graph?.pixiViewport?.removeListener('mousemove', appMouseMoveHandler)
      graph?.pixiViewport?.removeListener('mouseup', appMouseUpHandler)
    }
  }, [])
  return null
}
export default PixiRenderer
