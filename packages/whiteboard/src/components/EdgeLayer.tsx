import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { useWhiteboard, useWhiteboardInstance, useWhiteboardSelection, useWhiteboardState } from '../hooks'
import { findNearestNode, getBezierPath, getHandlePosition, getRelativeHandlePosition, hitTestNode } from '../utils'
import { EdgePosition, IWhiteboardEdge, IWhiteboardNode, SnapMode, WhiteboardEdgeStyle } from '../types/whiteboard'
import EdgeHandle from './EdgeHandle'

type HandleBox = { left: number; top: number; width: number; height: number }
type DragPreview = {
  edgeId: number
  dir: 'source' | 'target'
  pointer: { x: number; y: number }
  snappedNodeId?: number
  snappedHandle?: EdgePosition
  centerPoints?: Record<EdgePosition, { x: number; y: number }>
  closestCenter?: EdgePosition
}

const getNodeBox = (node: IWhiteboardNode): HandleBox => ({
  left: node.x,
  top: node.y,
  width: node.width || 120,
  height: node.height || 80
})

const resolveAttachPosition = (
  node: IWhiteboardNode,
  currentPos: { x: number; y: number },
  snapRadius: number,
  snapMode: SnapMode = 'mixed-4',
  prefer: 'auto' | 'horizontal' | 'vertical' = 'auto'
): EdgePosition | undefined => {
  const width = node.width || 120
  const height = node.height || 80

  // 1. 如果是纯边缘模式，直接返回边缘吸附结果
  if (snapMode === 'edge') {
    const relative = { x: currentPos.x - node.x, y: currentPos.y - node.y }
    const clamped = {
      x: Math.min(Math.max(relative.x, 0), width),
      y: Math.min(Math.max(relative.y, 0), height)
    }
    if (prefer === 'horizontal') {
      return clamped.x <= width / 2 ? 'left' : 'right'
    }
    if (prefer === 'vertical') {
      return clamped.y <= height / 2 ? 'top' : 'bottom'
    }
    return getRelativeHandlePosition({ width, height }, clamped)
  }

  // 2. 计算候选吸附点
  const candidatePoints: Partial<Record<EdgePosition, { x: number; y: number }>> = {}

  // 添加4个中心点
  if (snapMode === 'center-4' || snapMode === 'mixed-4' || snapMode === 'center-8' || snapMode === 'mixed-8') {
    candidatePoints.top = { x: node.x + width / 2, y: node.y }
    candidatePoints.right = { x: node.x + width, y: node.y + height / 2 }
    candidatePoints.bottom = { x: node.x + width / 2, y: node.y + height }
    candidatePoints.left = { x: node.x, y: node.y + height / 2 }
  }

  // 添加4个角点
  if (snapMode === 'center-8' || snapMode === 'mixed-8') {
    candidatePoints['top-left'] = { x: node.x, y: node.y }
    candidatePoints['top-right'] = { x: node.x + width, y: node.y }
    candidatePoints['bottom-left'] = { x: node.x, y: node.y + height }
    candidatePoints['bottom-right'] = { x: node.x + width, y: node.y + height }
  }

  // 3. 寻找最近的候选点
  let closestCenter: EdgePosition | null = null
  let closestDistance = Infinity

  for (const [position, point] of Object.entries(candidatePoints) as [EdgePosition, { x: number; y: number }][]) {
    const dx = currentPos.x - point.x
    const dy = currentPos.y - point.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    if (distance < closestDistance) {
      closestDistance = distance
      closestCenter = position
    }
  }

  // 4. 判断是否吸附
  if (closestCenter && closestDistance < snapRadius) {
    return closestCenter
  }

  // 5. 如果是混合模式且未吸附到点，Fallback到边缘吸附
  if (snapMode === 'mixed-4' || snapMode === 'mixed-8') {
    const relative = { x: currentPos.x - node.x, y: currentPos.y - node.y }
    const clamped = {
      x: Math.min(Math.max(relative.x, 0), width),
      y: Math.min(Math.max(relative.y, 0), height)
    }
    if (prefer === 'horizontal') {
      return clamped.x <= width / 2 ? 'left' : 'right'
    }
    if (prefer === 'vertical') {
      return clamped.y <= height / 2 ? 'top' : 'bottom'
    }
    return getRelativeHandlePosition({ width, height }, clamped)
  }

  return undefined
}

const EdgeLayer = memo(() => {
  const whiteboard = useWhiteboard()
  const selection = useWhiteboardSelection()
  const instance = useWhiteboardInstance()
  const { lastViewport, edgeSnapRadius, edgeSnapPrefer, edgeHandleOffset, edgeStyleResolver, snapMode } = useWhiteboardState()
  const [dragging, setDragging] = useState<{ edgeId: number; dir: 'source' | 'target' }>()
  const [hoverNodeId, setHoverNodeId] = useState<number>()
  const [dragPreview, setDragPreview] = useState<DragPreview>()
  const dragPreviewRef = useRef<DragPreview>()

  const edges = useMemo(() => Array.from(whiteboard.edges?.values() || []), [whiteboard.edges])
  const nodeBoxes = useMemo(() => {
    const map = new Map<number, HandleBox>()
    whiteboard.nodes?.forEach((n, id) => map.set(id, getNodeBox(n)))
    return map
  }, [whiteboard.nodes])
  const nodeMap = useMemo(() => {
    const map = new Map<number, IWhiteboardNode>()
    whiteboard.nodes?.forEach((n, id) => map.set(id, n))
    return map
  }, [whiteboard.nodes])

  const resolveStyle = (edge: IWhiteboardEdge): WhiteboardEdgeStyle => {
    const resolved = edgeStyleResolver?.(edge) || {}
    return {
      color: resolved.color ?? edge.color ?? '#94a3b8',
      width: resolved.width,
      lineStyle: resolved.lineStyle ?? (edge.lineStyle === 'dash' ? 'dash' : 'regular'),
      marker: resolved.marker ?? edge.marker ?? 'arrow'
    }
  }

  const markers = useMemo(() => {
    const defs = new Map<string, { id: string; color: string; type: 'arrow' }>()
    edges.forEach(edge => {
      const style = resolveStyle(edge)
      const markerType = style.marker ?? 'arrow'
      if (markerType === 'none') return
      const color = style.color || '#94a3b8'
      const key = `${markerType}-${color}`
      if (!defs.has(key)) {
        const safeColor = color.replace(/[^a-zA-Z0-9]/g, '')
        defs.set(key, { id: `edge-marker-${markerType}-${safeColor}`, color, type: 'arrow' })
      }
    })
    return Array.from(defs.values())
  }, [edges, edgeStyleResolver])

  useEffect(() => {
    dragPreviewRef.current = dragPreview
  }, [dragPreview])

  const snapRadius = edgeSnapRadius ?? 48
  const currentSnapMode = snapMode ?? 'mixed-4'

  const toBoardPoint = (e: PointerEvent) => {
    const scale = lastViewport?.scale || 1
    const offsetX = lastViewport?.x || 0
    const offsetY = lastViewport?.y || 0
    const viewport = instance.coordOps?.getViewportBox?.()
    const originX = viewport?.left ?? 0
    const originY = viewport?.top ?? 0
    return {
      x: (e.clientX - originX - offsetX) / scale,
      y: (e.clientY - originY - offsetY) / scale
    }
  }

  useEffect(() => {
    if (!dragging) return
    const move = (e: PointerEvent) => {
      const point = toBoardPoint(e)
      const nodes = instance.getAllNode?.() || []
      const hit = hitTestNode(point, nodes) ?? findNearestNode(point, nodes, snapRadius)

      if (hit) {
        const width = hit.width || 120
        const height = hit.height || 80

        // 计算候选吸附点
        const candidatePoints: Partial<Record<EdgePosition, { x: number; y: number }>> = {}

        if (currentSnapMode === 'center-4' || currentSnapMode === 'mixed-4' || currentSnapMode === 'center-8' || currentSnapMode === 'mixed-8') {
          candidatePoints.top = { x: hit.x + width / 2, y: hit.y }
          candidatePoints.right = { x: hit.x + width, y: hit.y + height / 2 }
          candidatePoints.bottom = { x: hit.x + width / 2, y: hit.y + height }
          candidatePoints.left = { x: hit.x, y: hit.y + height / 2 }
        }

        if (currentSnapMode === 'center-8' || currentSnapMode === 'mixed-8') {
          candidatePoints['top-left'] = { x: hit.x, y: hit.y }
          candidatePoints['top-right'] = { x: hit.x + width, y: hit.y }
          candidatePoints['bottom-left'] = { x: hit.x, y: hit.y + height }
          candidatePoints['bottom-right'] = { x: hit.x + width, y: hit.y + height }
        }

        // 找到最近的中心点
        let closestCenter: EdgePosition | null = null
        let closestDistance = Infinity
        for (const [position, centerPoint] of Object.entries(candidatePoints) as [EdgePosition, { x: number; y: number }][]) {
          const dx = point.x - centerPoint.x
          const dy = point.y - centerPoint.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          if (distance < closestDistance) {
            closestDistance = distance
            closestCenter = position
          }
        }

        const attachPos = resolveAttachPosition(hit, point, snapRadius, currentSnapMode, edgeSnapPrefer)

        setHoverNodeId(hit?.id)
        setDragPreview({
          edgeId: dragging.edgeId,
          dir: dragging.dir,
          pointer: point,
          snappedNodeId: hit?.id,
          snappedHandle: attachPos,
          centerPoints: candidatePoints as Record<EdgePosition, { x: number; y: number }>,
          closestCenter: closestDistance < snapRadius ? closestCenter : undefined
        })
      } else {
        setHoverNodeId(undefined)
        setDragPreview({
          edgeId: dragging.edgeId,
          dir: dragging.dir,
          pointer: point,
          snappedNodeId: undefined,
          snappedHandle: undefined,
          centerPoints: undefined,
          closestCenter: undefined
        })
      }
    }
    const up = () => {
      const preview = dragPreviewRef.current
      if (dragging) {
        const nodes = instance.getAllNode?.() || []
        const hit = preview?.snappedNodeId ? nodes.find(n => n.id === preview.snappedNodeId) : undefined
        if (hit && preview?.snappedHandle) {
          instance.edgeOps?.updateEdge?.(
            dragging.edgeId,
            edge => {
              if (dragging.dir === 'source') {
                return { ...edge, sourceId: hit.id, sourcePosition: preview.snappedHandle }
              }
              return { ...edge, targetId: hit.id, targetPosition: preview.snappedHandle }
            },
            true
          )
        }
      }
      setDragging(undefined)
      setDragPreview(undefined)
      setHoverNodeId(undefined)
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [dragging, instance, lastViewport?.scale, lastViewport?.x, lastViewport?.y, snapRadius, currentSnapMode])

  const renderEdge = (edge: IWhiteboardEdge) => {
    const sourceNode = nodeMap.get(edge.sourceId)
    const targetNode = nodeMap.get(edge.targetId)
    if (!sourceNode || !targetNode) return null
    const sourceBox = nodeBoxes.get(sourceNode.id) || getNodeBox(sourceNode)
    const targetBox = nodeBoxes.get(targetNode.id) || getNodeBox(targetNode)
    let sourcePosition: EdgePosition = edge.sourcePosition || 'right'
    let targetPosition: EdgePosition = edge.targetPosition || 'left'
    let sourceXY = getHandlePosition({ node: sourceNode, handle: sourcePosition, realtimeBox: sourceBox, handleOffset: edgeHandleOffset })
    let targetXY = getHandlePosition({
      node: targetNode,
      handle: targetPosition,
      realtimeBox: targetBox,
      handleOffset: edgeHandleOffset
    })
    const preview = dragPreview && dragPreview.edgeId === edge.id ? dragPreview : undefined
    if (preview) {
      if (preview.dir === 'source') {
        sourcePosition = preview.snappedHandle || sourcePosition
        const snapNode = preview.snappedNodeId ? nodeMap.get(preview.snappedNodeId) : undefined
        sourceXY = snapNode
          ? getHandlePosition({ node: snapNode, handle: sourcePosition, realtimeBox: getNodeBox(snapNode), handleOffset: edgeHandleOffset })
          : preview.pointer
      } else {
        targetPosition = preview.snappedHandle || targetPosition
        const snapNode = preview.snappedNodeId ? nodeMap.get(preview.snappedNodeId) : undefined
        targetXY = snapNode
          ? getHandlePosition({ node: snapNode, handle: targetPosition, realtimeBox: getNodeBox(snapNode), handleOffset: edgeHandleOffset })
          : preview.pointer
      }
    }
    if (!sourceXY || !targetXY) return null
    const style = resolveStyle(edge)
    const markerType = style.marker ?? 'arrow'
    const markerId =
      markerType !== 'none'
        ? markers.find(m => m.type === 'arrow' && m.color === (style.color || '#94a3b8'))?.id
        : undefined
    const [path] = getBezierPath({
      sourceX: sourceXY.x,
      sourceY: sourceXY.y,
      targetX: targetXY.x,
      targetY: targetXY.y,
      sourcePosition,
      targetPosition
    })
    const selected = selection.edges.has(edge.id)
    const baseStroke = style.color || '#94a3b8'
    const baseWidth = style.width ?? 2
    const highlightStroke = selected ? baseStroke || '#2e7dff' : baseStroke
    const previewPath = preview
      ? getBezierPath({
        sourceX: sourceXY.x,
        sourceY: sourceXY.y,
        targetX: targetXY.x,
        targetY: targetXY.y,
        sourcePosition,
        targetPosition
      })[0]
      : undefined

    return (
      <g key={edge.id}>
        <path
          d={path}
          stroke={highlightStroke}
          strokeWidth={selected ? baseWidth + 1 : baseWidth}
          fill="none"
          style={{ cursor: 'pointer', pointerEvents: 'auto' }}
          markerEnd={markerId ? `url(#${markerId})` : undefined}
          onPointerDown={e => {
            e.stopPropagation()
            instance.selectOps?.setSelection?.({
              nodes: selection.nodes,
              edges: new Set([edge.id])
            })
          }}
        />
        {previewPath && (
          <path
            d={previewPath}
            stroke={style.color || '#0ea5e9'}
            strokeWidth={selected ? baseWidth + 1 : baseWidth}
            strokeDasharray={(style.lineStyle ?? edge.lineStyle) === 'dash' ? '6 4' : '4 2'}
            fill="none"
            pointerEvents="none"
            markerEnd={markerId ? `url(#${markerId})` : undefined}
          />
        )}
        {selected && (
          <>
            <EdgeHandle
              x={sourceXY.x}
              y={sourceXY.y}
              onPointerDown={e => {
                e.stopPropagation()
                setDragging({ edgeId: edge.id, dir: 'source' })
                setDragPreview({
                  edgeId: edge.id,
                  dir: 'source',
                  pointer: { x: sourceXY!.x, y: sourceXY!.y },
                  snappedNodeId: edge.sourceId,
                  snappedHandle: sourcePosition
                })
              }}
            />
            <EdgeHandle
              x={targetXY.x}
              y={targetXY.y}
              onPointerDown={e => {
                e.stopPropagation()
                setDragging({ edgeId: edge.id, dir: 'target' })
                setDragPreview({
                  edgeId: edge.id,
                  dir: 'target',
                  pointer: { x: targetXY!.x, y: targetXY!.y },
                  snappedNodeId: edge.targetId,
                  snappedHandle: targetPosition
                })
              }}
            />
          </>
        )}
      </g>
    )
  }

  if (!edges.length) return null
  const highlightedNodeId = dragPreview?.snappedNodeId ?? hoverNodeId

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0
      }}
    >
      <svg width={0} height={0} style={{ position: 'absolute' }}>
        <defs>
          {markers.map(marker => (
            <marker
              key={marker.id}
              id={marker.id}
              viewBox="0 0 12 12"
              refX="10"
              refY="6"
              markerWidth="12"
              markerHeight="12"
              orient="auto-start-reverse"
            >
              <path d="M0,0 L12,6 L0,12 z" fill={marker.color} />
            </marker>
          ))}
        </defs>
      </svg>
      <svg
        role="edges"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'visible',
          pointerEvents: 'none'
        }}
      >
        {edges.map(renderEdge)}
      </svg>
      {highlightedNodeId && nodeMap.get(highlightedNodeId) && (
        <div
          style={{
            position: 'absolute',
            left: nodeMap.get(highlightedNodeId)!.x,
            top: nodeMap.get(highlightedNodeId)!.y,
            width: nodeMap.get(highlightedNodeId)!.width || 120,
            height: nodeMap.get(highlightedNodeId)!.height || 80,
            border: '2px solid rgba(14,165,233,0.8)',
            boxShadow: '0 10px 30px rgba(14,165,233,0.2), 0 0 0 4px rgba(14,165,233,0.12)',
            borderRadius: 10,
            background: 'rgba(14,165,233,0.06)',
            pointerEvents: 'none'
          }}
        />
      )}
      {/* 中心点指示器 */}
      {dragPreview?.centerPoints && highlightedNodeId && (
        <>
          {(Object.entries(dragPreview.centerPoints) as [EdgePosition, { x: number; y: number }][]).map(
            ([position, point]) => {
              const isClosest = dragPreview.closestCenter === position
              return (
                <div
                  key={position}
                  style={{
                    position: 'absolute',
                    left: point.x,
                    top: point.y,
                    width: isClosest ? 8 : 6,
                    height: isClosest ? 8 : 6,
                    borderRadius: '50%',
                    backgroundColor: isClosest ? 'rgba(14, 165, 233, 1)' : 'rgba(14, 165, 233, 0.4)',
                    border: '2px solid white',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: isClosest ? '0 0 8px rgba(14,165,233,0.8)' : 'none',
                    pointerEvents: 'none',
                    transition: 'all 0.15s ease',
                    zIndex: 1000
                  }}
                />
              )
            }
          )}
        </>
      )}
    </div>
  )
})

export default EdgeLayer
