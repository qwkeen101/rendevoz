import { useMemoizedFn } from '@/hooks'
import { memo, MouseEvent, useEffect, useRef } from 'react'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useGraphNodes from '../hooks/useGraphNodes'
import { GraphNode } from '../types/node'
import useGraphFilter from '../hooks/useGraphFilter'
import { Container, useApp } from '@pixi/react'
import PixiNode from '@/core/components/graph/components/node/PixiNode'
import { GlobalSetting } from '@/core'
import { LeftTopPosition } from '~/typings'
import { mousePos } from '@/hooks/utils/useMousePositionRef'

export type NodeMouseEventHandler = (e: MouseEvent, node: GraphNode) => void

export const NodeFakeHiddenOpacity = 0.1
export const NodeFullVisibleOpacity = 1
type ContainerProps = {
  onMouseEnter?: NodeMouseEventHandler
  onMouseLeave?: NodeMouseEventHandler
  nodes: GraphNode[]
  onClick: NodeMouseEventHandler
  onContextMenu: NodeMouseEventHandler
}
const NodeContainer = memo(() => {
  const [nodes] = useGraphNodes()
  const [edges] = useEdges()
  const graph = useGraph()
  const hoverNodeId = useRef<{
    id: number
    pos: LeftTopPosition
  }>()
  const { handleNodePointerEnter, handleNodePointerLeave } = useGraphFilter()
  const nodeMouseEnterHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      if ((node.opacity ?? 1) < 1) return
      const oState = graph.overlayManager?.getState()
      if (!(oState && oState.visible && oState.content === 'contentDisplayer' && oState.metaId === node.id)) {
        hoverNodeId.current = {
          id: node.id,
          pos: {
            left: e.clientX,
            top: e.clientY
          }
        }
      }
      setTimeout(() => {
        if (graph.currentClickNodeId) {
          hoverNodeId.current = undefined
          return
        }
        if (hoverNodeId.current && hoverNodeId.current.id === node.id) {
          const setting = GlobalSetting.getSetting().graph.previewContent
          if (setting) {
            graph.overlayManager?.setOverlayState(s =>
              s.visible && s.content === 'contentDisplayer' && s.metaId === hoverNodeId.current?.id
                ? s
                : {
                    visible: true,
                    content: 'contentDisplayer',
                    metaId: hoverNodeId.current!.id,
                    position: {
                      left: mousePos.current[0],
                      top: mousePos.current[1]
                    }
                  }
            )
          }
        }
      }, 500)
      handleNodePointerEnter(node.id)
    }
  })

  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      hoverNodeId.current = undefined
      if (graph.isDragging) return
      handleNodePointerLeave()
    }
  })

  const nodeClickHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    e.stopPropagation()
    hoverNodeId.current = undefined
    const setting = GlobalSetting.getSetting()
    if (setting.graph.openIn === 'side peek') {
      graph.sidePeek?.(node.id)
    } else {
      Global.layoutOps?.openObject(node.id)
    }
  })
  const nodeContextMenuHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    hoverNodeId.current = undefined
    graph.overlayManager?.setOverlayState({
      content: 'nodePopover',
      nodeId: node.id,
      metaId: node.id,
      visible: true,
      position: { left: e.clientX, top: e.clientY }
    })
  })
  return (
    <PIXIContainer
      nodes={nodes}
      onContextMenu={nodeContextMenuHandler}
      onClick={nodeClickHandler}
      onMouseEnter={nodeMouseEnterHandler}
      onMouseLeave={nodeMouseLeaveHandler}
    />
  )
})

const PIXIContainer = ({ nodes, onClick, onMouseEnter, onMouseLeave, onContextMenu }: ContainerProps) => {
  const app = useApp()
  const graph = useGraph()
  useEffect(() => {
    const resize = () => {
      const parent = app.view.parentNode
      if (parent) {
        const width = parent.clientWidth,
          height = parent.clientHeight
        app.renderer.resize(width, height)
        graph?.pixiViewport?.resize(width, height, width, height)
      }
    }
    const resizeHandler = () => {
      resize()
    }
    window.addEventListener('resize', resizeHandler)
    resize()
    return () => {
      window.removeEventListener('resize', resizeHandler)
    }
  }, [app])
  return (
    <Container position={[0, 0]}>
      {nodes?.map(node => (
        <PixiNode
          node={node}
          key={node.id}
          onContextMenu={onContextMenu}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          onClick={onClick}
        />
      ))}
    </Container>
  )
}
export default NodeContainer
