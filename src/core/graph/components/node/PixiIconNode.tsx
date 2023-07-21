import { GraphNode } from '../../types/node'
import { getRadius } from './Node'
import { Rendevoz } from '@/core/rendevoz'
import { PixiComponent, Sprite, useApp } from '@pixi/react'
import { useMemo } from 'react'
import { BLEND_MODES, Graphics as _Graphics, TextStyle } from 'pixi.js'
import * as Icons from '@icon-park/svg'
import _ from 'lodash'
import { SVGScene } from '@pixi-essentials/svg'
import useGraph from '@/core/graph/hooks/useGraph'

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
  fontSize: 10,
  align: 'center',
  fill: 'white',
  breakWords: true,
  fontFamily: ['sans-serif'],
  wordWrap: false
})

const PixiIconNode = ({ node, label }: { node: GraphNode; label?: string }) => {
  const radius = getRadius(node.type)
  const d = radius * 2

  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')
  const app = useApp()
  const graph = useGraph()
  useMemo(() => {
    const iconz = Rendevoz.Utils.Object.getMetaObjectIcon(node.type)
    if (graph?.CACHED_ICON_TEXTURE.has(iconz)) return
    if (iconz.startsWith('park')) {
      const replaced = iconz
        .replace('park-', '')
        .split('-')
        .map(i => _.capitalize(i))
        .join('')
      const icon = Icons[replaced]
      if (icon) {
        const str = icon({ theme: 'outline', size: d - 12, fill: 'white' }).replace('<?xml version="1.0" encoding="UTF-8"?>', '')
        const svgEle = new DOMParser().parseFromString(str, 'image/svg+xml')
        const e = svgEle.documentElement
        const scene = new SVGScene(e)
        const t = app.renderer.generateTexture(scene, { resolution: window.devicePixelRatio + 2 })
        graph?.CACHED_ICON_TEXTURE.set(iconz, t)
      }
    }
  }, [])
  const texture = graph?.CACHED_ICON_TEXTURE.get(Rendevoz.Utils.Object.getMetaObjectIcon(node.type))
  return (
    <>
      <GraphicsBg d={d} />
      <Sprite name={'sprite'} texture={texture} width={d - 6} height={d - 6} x={3} y={3} tint={primaryFontColor}/>
    </>
  )
}

export default PixiIconNode
