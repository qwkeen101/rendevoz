import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboard, useWhiteboardInstance, useWhiteboardSelection, useWhiteboardState } from '../hooks'
import { IWhiteboardNode } from '../types'
import ResizableNode from './ResizableNode'
import { DefaultNodeRenderer } from './renderers'

type DragState =
  | {
    nodeId: number
    startX: number
    startY: number
    originX: number
    originY: number
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
      const scale = lastViewport?.scale || 1
      const deltaX = (e.clientX - dragState.startX) / scale
      const deltaY = (e.clientY - dragState.startY) / scale
      const nextX = dragState.originX + deltaX
      const nextY = dragState.originY + deltaY
      lastPosition.current = { x: nextX, y: nextY }
      instance.updateWhiteboard?.(draft => {
        const node = draft.nodes?.get(dragState.nodeId)
        if (node) {
          draft.nodes?.set(dragState.nodeId, {
            ...node,
            x: nextX,
            y: nextY
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
  }, [dragState, instance, lastViewport?.scale])

  // Get renderer for a specific node type
  const getNodeRenderer = useCallback(
    (node: IWhiteboardNode) => {
      const renderer = nodeRenderers?.[node.type]
      return renderer || DefaultNodeRenderer
    },
    [nodeRenderers]
  )

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
          >
            <div
              role="node"
              data-node-id={node.id}
              onPointerDown={e => {
                if (e.button !== 0) return
                e.stopPropagation()
                e.preventDefault()
                instance.selectOps?.selectNode?.(node.id, e.shiftKey)
                setDragState({
                  nodeId: node.id,
                  startX: e.clientX,
                  startY: e.clientY,
                  originX: node.x,
                  originY: node.y
                })
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
              <Renderer node={node} selected={selected} instance={instance} onChange={handleChange} onClick={handleClick} />
            </div>
          </ResizableNode>
        )
      })}
    </div>
  )
}

export default NodeLayer
