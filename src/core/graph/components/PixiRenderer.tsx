import { useApp } from '@pixi/react'
import useGraph from '@/core/graph/hooks/useGraph'
import { useEffect, useRef } from 'react'
import { FederatedPointerEvent } from 'pixi.js'

const PixiRenderer = () => {
  const graph = useGraph()
  const simuRestarted = useRef(false)
  const dragTimer = useRef(0)
  const appMouseMoveHandler = (e: FederatedPointerEvent) => {
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
        graph.d3Simulation?.alphaTarget(0.1)
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
          const originNode = graph.nodesMap?.get(graph.currentClickNodeId)
          if (originNode) {
            originNode.fx = nextX - bound.width / 2
            originNode.fy = nextY - bound.height / 2
          }
        }
      }
    }
  }
  const appMouseUpHandler = (e: FederatedPointerEvent) => {
    if (graph) {
      setTimeout(() => {
        graph.currentClickNodeId = undefined
      }, 50)
      if (graph?.pixiViewport) {
        graph.pixiViewport.pause = false
      }
      dragTimer.current = 0
      if (simuRestarted.current) {
        graph?.d3Simulation?.alphaTarget(0)
        simuRestarted.current = false
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
