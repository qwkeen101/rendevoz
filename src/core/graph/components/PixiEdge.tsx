import { FC, memo, MouseEventHandler, useRef, useState } from 'react'
import { GraphEdge } from '../types/edge'
import { MarkerColor } from '@/consts'
import useGraph from '../hooks/useGraph'
import { useMemoizedFn } from '@/hooks'
import { getRadius } from './node/Node'
import { NodeFakeHiddenOpacity } from '../consts/opacity'
import { useStore } from 'jotai'
import { Container, Graphics, Sprite, Text } from '@pixi/react'
import drawEdgeBetweenTwoNodes from '@/core/graph/utils/drawEdgeBetweenTwoNodes'
import { BLEND_MODES, Graphics as _Graphics, Polygon, Text as _Text } from 'pixi.js'
import { fontStyle } from '@/core/graph/components/node/PixiIconNode'
import { oppositeEdgesMapAtom } from '@/core/graph/hooks/useEdges'
import arrowSvg from '@/assets/upSvg.svg?url'

interface EdgeProps {
  edge: GraphEdge
}

const PixiEdge: FC<EdgeProps> = memo(({ edge }) => {
  const graph = useGraph()

  const finalPositionRef = useRef<{
    targetx: number
    targety: number
    sourcex: number
    sourcey: number
  }>()
  const [highlight, setHighlight] = useState(false)
  const textRectRef = useRef<_Graphics>(null)
  const textRef = useRef<_Text>(null)
  const edgeGraphicRef = useRef<_Graphics>(null)
  const arrowHeadRef = useRef<_Graphics>(null)
  const isHidden = edge.opacity && edge.opacity < 1
  const arrowColor = edge.highlight || highlight ? edge.color || MarkerColor.EMPHASIS : edge.color || MarkerColor.LIGHTGREY
  const store = useStore()
  const hasOppo = store.get(oppositeEdgesMapAtom).has(edge.id)
  const shouldRender = () => {
    if (hasOppo) {
      if (finalPositionRef.current && finalPositionRef.current?.sourcex > finalPositionRef.current?.targetx) {
        return true
      }
      return false
    }
    return true
  }
  const drawEdge = useMemoizedFn(() => {
    edgeGraphicRef.current?.clear()
    const targetNode = graph?.nodesMap?.get(edge.targetId)
    const sourceNode = graph?.nodesMap?.get(edge.sourceId)
    if (!sourceNode || !targetNode || targetNode.x === undefined || sourceNode.x === undefined) return
    const { finalPosition: _f } = drawEdgeBetweenTwoNodes(
      {
        source: {
          x: sourceNode.x,
          y: sourceNode.y
        },
        target: {
          x: targetNode.x,
          y: targetNode.y
        }
      },
      {
        target: getRadius(targetNode.type),
        source: getRadius(sourceNode.type)
      },
      false
    )
    finalPositionRef.current = {
      sourcex: _f.sourceX,
      targetx: _f.targetX,
      sourcey: _f.sourceY,
      targety: _f.targetY
    }
    if (arrowHeadRef.current) {
      const horizontalDis = _f.targetX - _f.sourceX
      const veriticalDis = _f.targetY - _f.sourceY
      const degree = Math.atan2(veriticalDis, horizontalDis)
      const angle = (degree * 180) / Math.PI
      const arrowHead = arrowHeadRef.current
      const pos = hasOppo ? 0.3 : edge.label ? 0.4 : 0.5
      arrowHead.x = _f.targetX - horizontalDis * pos
      arrowHead.y = _f.targetY - veriticalDis * pos
      arrowHead.width = 12
      arrowHead.height = 12
      arrowHead.angle = 90 + angle
    }

    if (shouldRender() && edgeGraphicRef.current) {
      edgeGraphicRef.current.lineStyle(1, arrowColor, 0.6)
      edgeGraphicRef.current.moveTo(_f.sourceX, _f.sourceY)
      edgeGraphicRef.current.lineTo(_f.targetX, _f.targetY)
      edgeGraphicRef.current.hitArea = new Polygon([
        _f.sourceX - 5,
        _f.sourceY - 5,
        _f.sourceX + 5,
        _f.sourceY + 5,
        _f.targetX - 5,
        _f.targetY - 5,
        _f.targetX + 5,
        _f.targetY + 5
      ])
      const text = textRef.current
      if (text) {
        const center = {
          x: (_f.sourceX + _f.targetX) / 2,
          y: (_f.sourceY + _f.targetY) / 2
        }
        const { width, height } = text
        drawLabelRect(center.x, center.y, width, height)
        text.x = center.x
        text.y = center.y
      }
    }
  })
  const drawLabelRect = (centerX: number, centerY: number, width: number, height: number) => {
    const textRect = textRectRef.current
    if (textRect) {
      textRect.clear()
      textRect.blendMode = BLEND_MODES.DST_OUT
      textRect.beginFill('white', 1)
      textRect.drawRoundedRect(centerX - width / 2 - 4, centerY - height / 2 - 3, width + 8, height + 6, 6)

      textRect.endFill()
    }
  }
  graph?.ID_TO_EDGE_FUNCTION_MAP.set(edge.id, {
    drawEdge,
    resetLineWidth: w => {
      const graphics = edgeGraphicRef.current
      const finalPosition = finalPositionRef.current
      if (graphics && finalPosition) {
        if (shouldRender()) {
          graphics.clear()
          graphics.lineStyle(w, arrowColor, 0.6)
          graphics.moveTo(finalPosition?.sourcex, finalPosition?.sourcey)
          graphics.lineTo(finalPosition.targetx, finalPosition.targety)

          graphics.hitArea = new Polygon([
            finalPosition.sourcex - w * 2,
            finalPosition.sourcey - w * 2,
            finalPosition.sourcex + w * 2,
            finalPosition.sourcey + w * 2,
            finalPosition.targetx - w * 2,
            finalPosition.targety - w * 2,
            finalPosition.targetx + w * 2,
            finalPosition.targety + w * 2
          ])
        }

        const arrowHead = arrowHeadRef.current
        if (arrowHead) {
          arrowHead.width = w * 12
          arrowHead.height = w * 12
        }
      }
    },
    hideLabel: () => {
      if (textRef.current && textRectRef.current) {
        textRef.current.visible = false
        textRectRef.current.visible = false
      }
    },
    unhidenLabel: () => {
      if (textRef.current && textRectRef.current) {
        textRef.current.visible = true
        textRectRef.current.visible = true
      }
    }
  })
  console.log('rerender edge')
  const edgeMouseEnterHandler = () => {
    console.log('enter')
    if (edge.opacity !== NodeFakeHiddenOpacity) setHighlight(true)
  }
  const edgeMouseLeaveHandler = () => {
    setHighlight(false)
  }

  const edgeClickHandler: MouseEventHandler = e => {
    e.stopPropagation()
    e.preventDefault()
    const manager = graph?.overlayManager
    if (manager && !isHidden) {
      manager.setOverlayState(s => {
        return {
          visible: s.object?.id === edge.id ? !s.visible : true,
          content: 'edgeToolbar',
          position: {
            left: e.clientX,
            top: e.clientY - 10
          },
          object: edge
        }
      })
    }
  }

  return (
    <Container interactive={true} zIndex={isHidden ? 0 : 10} eventMode={(edge.opacity || 1) < 1 ? 'none' : 'auto'}>
      <Graphics
        interactive={true}
        cursor="pointer"
        onmouseenter={edgeMouseEnterHandler}
        onmouseleave={edgeMouseLeaveHandler}
        click={edgeClickHandler}
        ref={edgeGraphicRef}
        tint={arrowColor}
        // blendMode={BLEND_MODES.SRC_OUT}
        alpha={edge.opacity ?? 1}
      />
      <Sprite
        interactive={true}
        cursor="pointer"
        onmouseenter={edgeMouseEnterHandler}
        onmouseleave={edgeMouseLeaveHandler}
        click={edgeClickHandler}
        // texture={graph?.CACHED_ICON_TEXTURE.get('_edge_arrow')}
        anchor={0.5}
        image={arrowSvg}
        ref={arrowHeadRef}
        tint={arrowColor}
        alpha={edge.opacity ?? 1}
      />
      {edge.label && (
        <>
          <Graphics ref={textRectRef} />
          <Text
            text={edge.label}
            resolution={3}
            x={(finalPositionRef.current?.sourcex + finalPositionRef.current?.targetx) / 2}
            anchor={0.5}
            style={fontStyle}
            interactive={true}
            cursor="pointer"
            blendMode={BLEND_MODES.SRC_OVER}
            onmouseenter={edgeMouseEnterHandler}
            onmouseleave={edgeMouseLeaveHandler}
            click={edgeClickHandler}
            y={(finalPositionRef.current?.sourcey + finalPositionRef.current?.targety) / 2}
            ref={textRef}
            tint={arrowColor}
            alpha={edge.opacity ?? 1}
          />
        </>
      )}
    </Container>
  )
})

export default PixiEdge
