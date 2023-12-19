import { useMemoizedFn } from '@/hooks'
import { MetaStore } from '@/api/stores'
import Id from '@/utils/id'
import { memo, MouseEvent, useEffect } from 'react'
import { MetaLink } from '~/typings/data'
import useEdges from '../hooks/useEdges'
import useGraph from '../hooks/useGraph'
import useGraphNodes from '../hooks/useGraphNodes'
import { GraphNode } from '../types/node'
import useGraphFilter from '../hooks/useGraphFilter'
import { Container, useApp } from '@pixi/react'
import PixiNode from '@/core/components/graph/components/node/PixiNode'

export type NodeMouseEventHandler = (e: MouseEvent, node: GraphNode) => void

export const NodeFakeHiddenOpacity = 0.1
export const NodeFullVisibleOpacity = 1
const NodeContainer = memo(({ type }: { type: 'canvas' | 'svg' }) => {
  const [nodes] = useGraphNodes()
  const [edges] = useEdges()

  const { addMetaLink } = MetaStore
  const graph = useGraph()
  const { handleNodePointerEnter, handleNodePointerLeave } = useGraphFilter()
  const nodeMouseEnterHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      handleNodePointerEnter(node.id)
    }
  })

  const nodeMouseLeaveHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    if (nodes && edges && graph) {
      if (graph.isDragging) return
      handleNodePointerLeave()
    }
  })

  const nodeClickHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {
    e.stopPropagation()
    if (graph) {
      if (graph.isAddingEdge) {
        const startNode = graph.contextMenuNode
        const endNode = node
        if (startNode && endNode) {
          const newEdge = {
            sourceId: startNode.id,
            targetId: endNode.id,
            id: Id.getId()
          }
          if (newEdge.sourceId === newEdge.targetId) {
            graph.endAddEdge()
            return
          }
          if (edges?.some(e => e.sourceId === newEdge.sourceId && e.targetId === newEdge.targetId)) {
            graph.endAddEdge()
            return
          }
          const metaLink: Partial<MetaLink> = {
            sourceId: newEdge.sourceId,
            targetId: newEdge.targetId,
            targetType: node.type,
            sourceType: startNode.type
          }
          addMetaLink(metaLink)
          graph.registerNewAddedEdge(newEdge)
          graph.registerEdges([newEdge])
          graph.endAddEdge()
        }
      }
    }
  })
  const nodeContextMenuHandler: NodeMouseEventHandler = useMemoizedFn((e, node) => {})
  const app = type === 'canvas' && useApp()
  useEffect(() => {
    if (type === 'canvas' && app) {

      const resize = () => {
        console.log('resize')
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
    }
  }, [app])
  return (
    <Container position={[0, 0]}>
      {nodes?.map(node => (
        <PixiNode
          node={node}
          key={node.id}
          onMouseEnter={nodeMouseEnterHandler}
          onMouseLeave={nodeMouseLeaveHandler}
          onClick={nodeClickHandler}
        />
      ))}
    </Container>
  )
})
export default NodeContainer
