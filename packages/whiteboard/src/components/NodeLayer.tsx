import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboard, useWhiteboardInstance, useWhiteboardSelection, useWhiteboardState, useVirtualization } from '../hooks'
import { IWhiteboardNode, NodeRenderConfig } from '../types'
import ResizableNode from './ResizableNode'
import { DefaultNodeRenderer } from './renderers'

type DragState =
  | {
    nodeId: number
    offsetX: number
    offsetY: number
  }
  | undefined

const NodeLayer = () => {
  const whiteboard = useWhiteboard()
  const selection = useWhiteboardSelection()
  const instance = useWhiteboardInstance()
  const { lastViewport, nodeRenderers } = useWhiteboardState()
  const nodes = useMemo(() => Array.from(whiteboard.nodes?.values() || []), [whiteboard.nodes])
  const [dragState, setDragState] = useState<DragState>()
  const lastPosition = useRef<{ x: number; y: number }>()
  const layerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handlePointerMove = (e: PointerEvent) => {
      if (!dragState) return
      // Use coordOps to properly transform window position to whiteboard position
      const pos = instance.coordOps?.transformWindowPositionToPosition?.({ x: e.clientX, y: e.clientY })
      if (!pos) return

      // Apply offset to keep mouse at the same relative position on the node
      const nextPos = {
        x: pos.x - dragState.offsetX,
        y: pos.y - dragState.offsetY
      }

      lastPosition.current = nextPos
      instance.updateWhiteboard?.(draft => {
        const node = draft.nodes?.get(dragState.nodeId)
        if (node) {
          draft.nodes?.set(dragState.nodeId, {
            ...node,
            x: nextPos.x,
            y: nextPos.y
          })
        }
      }, false)
    }
    const handlePointerUp = () => {
      setDragState(undefined)
      if (dragState && lastPosition.current) {
        instance
          .updateWhiteboard?.(draft => {
            const node = draft.nodes?.get(dragState.nodeId)
            if (node) {
              draft.nodes?.set(dragState.nodeId, { ...node, ...lastPosition.current })
            }
          }, true)
          .then(() => instance.nodeOps?.updateRelatedEdges?.(dragState.nodeId))
      }
      lastPosition.current = undefined
    }
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [dragState, instance])

  // Get renderer for a specific node type
  const getNodeRenderer = useCallback(
    (node: IWhiteboardNode) => {
      const renderer = nodeRenderers?.[node.type]
      return renderer || DefaultNodeRenderer
    },
    [nodeRenderers]
  )

  // Get node render config
  const getNodeRenderConfig = useCallback(
    (nodeType: IWhiteboardNode['type']): NodeRenderConfig | undefined => {
      const renderer = nodeRenderers?.[nodeType]
      if (!renderer || typeof renderer === 'function') return undefined
      return renderer.config
    },
    [nodeRenderers]
  )

  // Use virtualization hook
  const { visibleNodeIds, keepAliveNodeIds } = useVirtualization()

  // Track visibility for lifecycle callbacks
  const prevVisibilityRef = useRef<Map<number, boolean>>(new Map())

  useEffect(() => {
    nodes.forEach(node => {
      const isVisible = visibleNodeIds.has(node.id)
      const wasVisible = prevVisibilityRef.current.get(node.id) ?? false
      const renderConfig = getNodeRenderConfig(node.type)

      if (!wasVisible && isVisible) {
        // Entered viewport
        renderConfig?.onEnterViewport?.(node)
      } else if (wasVisible && !isVisible) {
        // Left viewport
        renderConfig?.onLeaveViewport?.(node)
      }

      prevVisibilityRef.current.set(node.id, isVisible)
    })
  }, [visibleNodeIds, nodes, getNodeRenderConfig])

  return (
    <div
      ref={layerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none'
      }}
    >
      {nodes.map(node => {
        // Virtualization logic
        const isVisible = visibleNodeIds.has(node.id)
        const shouldKeepAlive = keepAliveNodeIds.has(node.id)
        const shouldUnmount = !isVisible && !shouldKeepAlive

        // Unmount node if not visible and not keepAlive
        if (shouldUnmount) {
          const renderConfig = getNodeRenderConfig(node.type)
          renderConfig?.onBeforeUnmount?.(node, 'viewport')
          return null
        }

        const selected = selection.nodes.has(node.id)
        const Renderer = getNodeRenderer(node)

        const handleChange = (updates: Partial<IWhiteboardNode>) => {
          instance.updateWhiteboard?.(draft => {
            const n = draft.nodes?.get(node.id)
            if (n) {
              draft.nodes?.set(node.id, { ...n, ...updates })
            }
          }, true)
        }

        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation()
          // Reserved for future focus/edit logic
        }

        // Extract component type
        const RendererComp = typeof Renderer === 'function' ? Renderer : Renderer.render

        return (
          <ResizableNode
            key={node.id}
            x={node.x}
            y={node.y}
            width={node.width || 120}
            height={node.height || 80}
            onResizeStart={() => {
              instance.selectOps?.selectNode?.(node.id, false)
            }}
            onResize={({ width, height }) => {
              instance.updateWhiteboard?.(draft => {
                const n = draft.nodes?.get(node.id)
                if (n) {
                  draft.nodes?.set(node.id, { ...n, width, height })
                }
              }, false)
            }}
            onResizeEnd={({ width, height }) => {
              instance
                .updateWhiteboard?.(draft => {
                  const n = draft.nodes?.get(node.id)
                  if (n) {
                    draft.nodes?.set(node.id, { ...n, width, height })
                  }
                }, true)
                .then(() => instance.nodeOps?.updateRelatedEdges?.(node.id))
            }}
            style={{ display: isVisible ? undefined : 'none' }}
          >
            <div
              ref={el => {
                if (el) instance.values.NODE_DOM_MAP?.set(node.id, el)
                else instance.values.NODE_DOM_MAP?.delete(node.id)
              }}
              role="node"
              data-node-id={node.id}
              onPointerDown={e => {
                if (e.button !== 0) return
                e.stopPropagation()
                e.preventDefault()
                instance.selectOps?.selectNode?.(node.id, e.shiftKey)

                // Calculate offset from mouse to node's top-left corner
                const pos = instance.coordOps?.transformWindowPositionToPosition?.({ x: e.clientX, y: e.clientY })
                if (pos) {
                  setDragState({
                    nodeId: node.id,
                    offsetX: pos.x - node.x,
                    offsetY: pos.y - node.y
                  })
                }
              }}
              style={{
                width: '100%',
                height: '100%',
                border: selected ? '2px solid #2e7dff' : '1px solid #d0d5dd',
                borderRadius: 8,
                background: '#fff',
                color: '#111827',
                boxShadow: selected ? '0 6px 16px rgba(46,125,255,0.25)' : '0 4px 10px rgba(0,0,0,0.06)',
                pointerEvents: 'auto',
                userSelect: 'none',
                boxSizing: 'border-box',
                overflow: 'hidden'
              }}
            >
              <RendererComp node={node} selected={selected} instance={instance} onChange={handleChange} onClick={handleClick} />
            </div>
          </ResizableNode>
        )
      })}
    </div>
  )
}

export default NodeLayer
