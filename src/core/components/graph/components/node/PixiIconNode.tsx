import { GraphNode } from '../../types/node'
import { PixiComponent, Sprite, useApp } from '@pixi/react'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Graphics as _Graphics, TextStyle } from 'pixi.js'
import { SVGScene } from '@pixi-essentials/svg'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { Icon } from '@/components'
import { useUpdate } from 'react-use'

const GraphicsBg = PixiComponent('gbg', {
  create: props => {
    const b = getComputedStyle(document.body).getPropertyValue('--global-background')
    const g = new _Graphics()
    g.beginFill(b)
    g.drawRoundedRect(0, 0, props.d, props.d, 4)
    g.endFill()
    return g
  }
})
export const fontStyle = new TextStyle({
  fontWeight: '300',
  fontSize: 6,
  align: 'center',
  fill: 'white'
})
const IS_LOADING_MAP = new Map<string, Set<VoidFunction>>()
const PixiIconNode = ({ node, size }: { node: GraphNode; size: number }) => {
  const d = size * 2

  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')
  const app = useApp()
  const graph = useGraph()
  const update = useUpdate()
  useMemo(() => {
    const iconz = Global.utils.getIcon(node.type)
    if (graph?.CACHED_ICON_TEXTURE.has(iconz)) return
    if (IS_LOADING_MAP.has(iconz)) {
      IS_LOADING_MAP.get(iconz)?.add(() => {
        update()
      })
      return
    }
    IS_LOADING_MAP.set(iconz, new Set())
    const ele = document.createElement('div')
    const root = createRoot(ele)
    root.render(
      <Icon
        name={iconz}
        fill={primaryFontColor}
        ref={n => {
          console.log(n)
          const svg = n?.querySelector('svg')
          if (svg) {
            const scene = new SVGScene(svg)
            const t = app.renderer?.generateTexture(scene, { resolution: window.devicePixelRatio + 2 })
            if (t) {
              graph.CACHED_ICON_TEXTURE.set(iconz, t)
              update()
              IS_LOADING_MAP.get(iconz)?.forEach(i => i())
              IS_LOADING_MAP.delete(iconz)
            }
          }
        }}
        size={d - 12}
      />
    )
  }, [])
  const texture = graph.CACHED_ICON_TEXTURE.get(Global.utils.getIcon(node.type))
  return (
    <>
      <GraphicsBg d={d} />
      {texture && <Sprite name={'sprite'} texture={texture} width={d} height={d} x={0} y={0} tint={primaryFontColor} />}
    </>
  )
}

export default PixiIconNode
