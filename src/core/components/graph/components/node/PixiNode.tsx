import { FC, memo, MouseEventHandler, useCallback, useEffect, useMemo, useRef } from 'react'
import useGraph from '@/core/components/graph/hooks/useGraph'
import { useAtomValue, useSetAtom } from 'jotai'
import { MetaStore } from '@/api/stores'
import { GraphPathFilterAtom } from '@/core/components/graph/components/GraphPathFilter'
import { GraphModeAtom } from '@/core/components/graph/hooks/useGraphMode'
import { GraphNode } from '@/core/components/graph/types/node'
import PixiImageNode from '@/core/components/graph/components/node/PixiImageNode'
import { Container, Text } from '@pixi/react'
import { DisplayObject, FederatedPointerEvent, Container as PContainer } from 'pixi.js'
import { GlobalInstance, useMemoizedFn, usePrevious } from '@/hooks'
import PixiIconNode, { fontStyle } from '@/core/components/graph/components/node/PixiIconNode'
import { animate } from 'framer-motion'
import { Rendevoz } from '@/core/rendevoz'
import { truncate } from 'lodash'

const getRadius = t => Rendevoz.Utils.Meta.getTypeRadius(t)
const PixiNode: FC<NodeProps> = memo(({ node, onMouseEnter, onMouseLeave, onContextMenu, onClick }) => {
  const nodeRef = useRef<PContainer<DisplayObject>>(null)
  const graph = useGraph()
  const meta = MetaStore.useValue(node.id)
  const setPathFilter = useSetAtom(GraphPathFilterAtom)
  const graphMode = useAtomValue(GraphModeAtom)
  const dragTimer = useRef(0)
  const radius = getRadius(node.type || 'normal')
  const d = radius * 2
  const originNode = graph?.nodesMap?.get(node.id)
  const previousAlpha = usePrevious(node.opacity)
  useEffect(() => {
    const nodee = nodeRef.current
    if (nodee && previousAlpha !== undefined && node.opacity !== undefined) {
      animate(previousAlpha, node.opacity, {
        onUpdate: v => {
          nodee.alpha = v
        }
      })
    }
  }, [node.opacity])
  const realNode = useMemo(() => {
    return {
      ...node,
      label: truncate(meta?.name || meta?.placeholderName || '', {
        length: 32
      }),
      coverImgSrc: meta?.coverImgSrc,
      icon: meta?.icon
    } as Partial<GraphNode>
  }, [meta, node])

  // use this to simulate drag & drop
  const isDragging = useRef(false)

  const renderNode = () => {
    if (graphMode === 'simple') {
      return null
    }
    if (!meta || meta.deleted) return null
    if (meta.coverImgSrc) {
      return <PixiImageNode node={realNode} />
    }
    switch (meta.type) {
      case 'note':
      case 'whiteboard':
      case 'pdfLabel':
      case 'noteLabel':
      case 'noteBlock':
      case 'pdf':
      case 'image':
        return <PixiIconNode node={realNode} />
      default:
        return <PixiIconNode node={realNode} />
    }
  }
  useEffect(() => {
    if (nodeRef.current) {
      const n = nodeRef.current
      graph?.ID_TO_PIXI_NODE_MAP.set(node.id, n)
      graph?.ID_TO_NODE_FUNCTION_MAP.set(node.id, {
        changePosition: pos => {
          n.x = pos.x
          n.y = pos.y
        }
      })
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
    if (graph?.isChoosingNode === 'end') {
      graph.overlayManager?.setContent('pathIndicator')
      const nodeBounding = {
        left: e.clientX,
        top: e.clientY,
        width: e.width
      }
      console.log(nodeBounding)
      graph.overlayManager?.setPosition({
        left: nodeBounding?.left + nodeBounding?.width / 2,
        top: nodeBounding?.top - 15
      })
      graph.overlayManager?.open()

      setPathFilter(f => ({ ...f, tempEndNodeId: node.id }))
    }
  }
  const handleMouseLeave = (e: FederatedPointerEvent) => {
    onMouseLeave?.(e, node)
    if (graph?.isChoosingNode === 'end') {
      setPathFilter(f => {
        if (f?.tempEndNodeId === node.id) {
          graph.overlayManager?.close()
          return { ...f, tempEndNodeId: undefined }
        }
        return f
      })
    }
  }
  const handleContextMenu = (e: FederatedPointerEvent) => {
    onContextMenu?.(e, node)
    const rect = {
      left: e.clientX,
      top: e.clientY,
      width: e.width
    }
    graph?.overlayManager?.setOverlayState({
      position: {
        left: rect.left + rect.width / 2,
        top: rect.top - 10
      },
      visible: true,
      content: 'nodePopover',
      nodeId: node.id,
      metaId: node.id
    })
  }
  const handleClick = (e: FederatedPointerEvent) => {
    e.preventDefault()

    e.nativeEvent.preventDefault()
    if (graph?.isChoosingNode === 'start') {
      setPathFilter(f => ({ ...f, startNodeId: node.id }))
      graph.isChoosingNode = false
      return
    }
    if (graph?.isChoosingNode === 'end') {
      setPathFilter(f => ({ ...f, endNodeId: node.id }))
      graph.isChoosingNode = false
      return
    }
    onClick?.(e, node)

    if (graph?.isDragging) return
    if (meta) {
      GlobalInstance.layoutOps?.openObject(meta.id)
    }
  }

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
    if (isDragging.current && originNode) {
      if (graph?.isAddingEdge) return
      if (Date.now() - dragTimer.current < 100) return
      originNode.fx = null
      originNode.fy = null
    }

    isDragging.current = false
  })

  const handleMouseMove = useMemoizedFn((e: FederatedPointerEvent) => {})
  const primaryFontColor = getComputedStyle(document.body).getPropertyValue('--font-primary')
  return (
    <Container
      interactive={true}
      rightclick={handleContextMenu}
      click={handleClick}
      onmouseenter={handleMouseEnter}
      onmouseleave={handleMouseLeave}
      mousemove={handleMouseMove}
      mousedown={handleMouseDown}
      mouseup={handleMouseUp}
      cursor="pointer"
      ref={nodeRef}
      // alpha={node.opacity || 1}
      // position={[node.x ?? 0, node.y ?? 0]}
    >
      <Container cursor="pointer" position={[0, 0]}>
        {renderNode()}
      </Container>
      <Text
        text={realNode.label}
        x={d / 2}
        y={d + 6}
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
