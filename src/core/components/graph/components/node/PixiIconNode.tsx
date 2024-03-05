import { GraphNode } from '../../types/node'
import { Rendevoz } from '@/core/rendevoz'
import { PixiComponent, Sprite, useApp } from '@pixi/react'
import { useMemo } from 'react'
import { createRoot } from 'react-dom/client'
import { Graphics as _Graphics, TextStyle } from 'pixi.js'
import * as Icons from '@icon-park/svg'
import _ from 'lodash'
import { SVGScene } from '@pixi-essentials/svg'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { Icon } from '@/components'
import { useUpdate } from 'react-use'
const GraphicsBg = PixiComponent('gbg', {
  create: props => {
    const b = getComputedStyle(document.body).getPropertyValue('--global-background')
    const g = new _Graphics()
    // g.lineStyle(1, 'white')
    g.beginFill(b)
    // g.blendMode = BLEND_MODES.DST_OUT
    // g.x = 0
    // g.y = 0
    g.drawRoundedRect(0, 0, props.d, props.d, 4)
    g.endFill()
    return g
  }
})
export const fontStyle = new TextStyle({
  fontWeight: '400',
  fontSize: 8,
  align: 'center',
  fill: 'white',
  wordWrapWidth: 240,
  breakWords: true,
  fontFamily: ['Inter'],
  wordWrap: true,
  whiteSpace: 'normal'
})
const IS_LOADING_MAP = new Map<string, Set<VoidFunction>>()
const PixiIconNode = ({ node }: { node: GraphNode }) => {
  const radius = Rendevoz.Utils.Meta.getTypeRadius(node.type)
  const d = radius * 2

  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')
  const app = useApp()
  const graph = useGraph()
  const update = useUpdate()
  useMemo(() => {
    const iconz = Rendevoz.Utils.Object.getMetaObjectIcon(node.type)
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
              graph?.CACHED_ICON_TEXTURE.set(iconz, t)
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
  const texture = graph?.CACHED_ICON_TEXTURE.get(Rendevoz.Utils.Object.getMetaObjectIcon(node.type))
  return (
    <>
      <GraphicsBg d={d} />
      {texture && <Sprite name={'sprite'} texture={texture} width={d - 6} height={d - 6} x={3} y={3} tint={primaryFontColor} />}
    </>
  )
}

export default PixiIconNode
