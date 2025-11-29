import { FC, memo, useCallback, useEffect, useMemo, useRef } from 'react'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { MetaStore } from '@/api/stores'
import { GraphNode } from '@/core/components/graph/types/node'
import PixiImageNode from '@/core/components/graph/components/node/PixiImageNode'
import { Container, Text } from '@pixi/react'
import { DisplayObject, FederatedPointerEvent, Container as PContainer } from 'pixi.js'
import { useGlobalAtomValue, useMemoizedFn, usePrevious } from '@/hooks'
import PixiIconNode, { fontStyle } from '@/core/components/graph/components/node/PixiIconNode'
import { animate } from 'framer-motion'
import { isEqual, truncate } from 'lodash'
import { GlobalSetting } from '@/core'
import PixiSimpleMode from '@/core/components/graph/components/node/PixiSimpleMode'
import { selectAtom } from 'jotai/utils'
import { NodeMouseEventHandler } from '@/core/components/graph/components/NodeContainer'
import { Colors } from '@/consts'

const selectedAtom = selectAtom(
  GlobalSetting.settingAtom,
  s => ({
    simpleMode: s.graph.simpleMode,
    nodeSize: s.graph.nodeSize,
    nodeColor: s.graph.nodeColor
  }),
  isEqual
)
const PixiNode: FC<{
  node: GraphNode
  onMouseEnter: NodeMouseEventHandler
  onMouseLeave: NodeMouseEventHandler
  onClick: NodeMouseEventHandler
  onContextMenu: NodeMouseEventHandler
}> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<PContainer<DisplayObject>>(null)
  const graph = useGraph()
  const meta = MetaStore.useValue(node.id)
  const { simpleMode, nodeColor, nodeSize } = useGlobalAtomValue(selectedAtom)
  const realColor = node.isCenter ? 'rgb(35,131,226)' : node.color || nodeColor
  const dragTimer = useRef(0)
  const d = nodeSize * 2
  const previousAlpha = usePrevious(node.opacity)
  useEffect(() => {
    const nodee = nodeRef.current
    if (nodee && node.opacity !== undefined) {
      if (previousAlpha !== undefined) {
        animate(previousAlpha, node.opacity, {
          onUpdate: v => {
            nodee.alpha = v
          }
        })
      } else {
        nodee.alpha = node.opacity
      }
    }
  }, [node.opacity])
  const realNode = useMemo(() => {
    return {
      ...node,
      label: truncate(meta?.name || meta?.placeholderName || '', {
        length: 20
      }).replaceAll('\n', ' '),
      coverImgSrc: meta?.coverImgSrc,
      icon: meta?.icon
    } as Partial<GraphNode>
  }, [meta, node])

  // use this to simulate drag & drop
  const isDragging = useRef(false)

  const renderNode = () => {
    if (simpleMode) {
      return <PixiSimpleMode color={realColor} size={nodeSize} />
    }
    if (!meta || meta.deleted) return null
    if (meta.coverImgSrc) {
      return <PixiImageNode size={nodeSize} color={realColor} node={realNode} />
    }
    return <PixiIconNode size={nodeSize} node={realNode} />
  }
  useEffect(() => {
    if (nodeRef.current) {
      const n = nodeRef.current
      graph?.ID_TO_PIXI_NODE_MAP.set(node.id, n)
      const firstChild = n.children[0]
      if (firstChild.pivot.x === 0) {
        const bound = firstChild.getLocalBounds()
        n.pivot = {
          x: bound.width / 2,
          y: bound.height / 2
        }
      }
    }
  }, [node, graph])

  const handleMouseEnter = (e: FederatedPointerEvent) => {
    onMouseEnter?.(e, node)
  }
  const handleMouseLeave = (e: FederatedPointerEvent) => {
    onMouseLeave?.(e, node)
  }
  const handleContextMenu = (e: FederatedPointerEvent) => {
    onContextMenu?.(e, node)
  }
  const handleClick = (e: FederatedPointerEvent) => {
    e.preventDefault()
    e.nativeEvent.preventDefault()
    if (graph?.isDragging) return
    onClick?.(e, node)
  }

  // see drag and drop in pixi renderer -> /graph/components/pixirenderer
  const handleMouseDown = useCallback(() => {
    isDragging.current = true
    if (graph?.pixiViewport) {
      graph.pixiViewport.pause = true
    }
    if (graph) {
      graph.currentClickNodeId = node.id
    }
    dragTimer.current = Date.now()
  }, [])

  const handleMouseUp = useMemoizedFn(() => {
    isDragging.current = false
  })
  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')
  return (
    <Container
      eventMode={'static'}
      rightclick={handleContextMenu}
      click={handleClick}
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
      mousedown={handleMouseDown}
      mouseup={handleMouseUp}
      cursor="pointer"
      ref={nodeRef}
      position={[(node.x ?? 0) + nodeSize, (node.y ?? 0) + nodeSize]}
    >
      <Container position={[0, 0]}>{renderNode()}</Container>
      <Text
        text={realNode.label}
        x={d / 2}
        y={d + 7}
        anchor={0.5}
        style={fontStyle}
        resolution={3}
        tint={primaryFontColor}
        eventMode="none"
      />
    </Container>
  )
})

export default PixiNode
