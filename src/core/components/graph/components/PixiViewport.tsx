import { PixiComponent, useApp } from '@pixi/react'
import * as PIXI from 'pixi.js'
import { Viewport as Viewport } from 'pixi-viewport'
import React from 'react'
import useGraph from '@/core/components/graph/hooks/useGraph'
import D3GraphManager from '@/core/components/graph/D3GraphManager'
import { animate } from 'framer-motion'
interface ViewportProps {
  width: number
  height: number
  children?: React.ReactNode
}
export interface PixiComponentViewportProps extends ViewportProps {
  app: PIXI.Application
  graph: D3GraphManager
}
const PixiViewport = (props: ViewportProps) => {
  const pixiApp = useApp()
  const graph = useGraph()
  return <ViewportComponent app={pixiApp} {...props} graph={graph!} />
}

const ViewportComponent = PixiComponent('Viewport', {
  applyProps(instance, o, n) {
    n.graph.pixiViewport = instance
  },
  create: (props: PixiComponentViewportProps) => {
    const viewport = new Viewport({
      ticker: props.app.ticker,
      screenWidth: props.width,
      screenHeight: props.height,
      worldWidth: props.width,
      worldHeight: props.height,
      events: props.app.renderer.events
    })
    props.graph.pixiViewport = viewport
    let labelHidden = false
    let previousZoom = viewport.scale.x
    viewport.on('frame-end', () => {
      if (viewport.dirty) {
        const currentZoom = viewport.scale.x
        if (currentZoom !== previousZoom) {
          previousZoom = currentZoom
          const zoom = viewport.scale.x
          if (zoom >= 0.6 && labelHidden) {
            props.graph.ID_TO_PIXI_NODE_MAP.forEach(i => {
              const texts = i.children.filter(i => i instanceof PIXI.Text)
              animate(0, 1, {
                onUpdate: v => {
                  texts.forEach(i => (i.alpha = v))
                }
              })
            })
            props.graph.ID_TO_EDGE_FUNCTION_MAP.forEach(i => {
              i.unhidenLabel()
            })
            labelHidden = false
          }
          if (zoom < 0.6 && !labelHidden) {
            props.graph.ID_TO_PIXI_NODE_MAP.forEach(i => {
              const texts = i.children.filter(i => i instanceof PIXI.Text)
              animate(1, 0, {
                onUpdate: v => {
                  texts.forEach(i => (i.alpha = v))
                }
              })
            })
            props.graph.ID_TO_EDGE_FUNCTION_MAP.forEach(i => {
              i.hideLabel()
            })
            labelHidden = true
          }
        }
        viewport.dirty = false
      }
    })
    viewport.drag().pinch().wheel().clampZoom({ minScale: 0.1, maxScale: 2 }).decelerate()
    return viewport
  }
})
export default PixiViewport
