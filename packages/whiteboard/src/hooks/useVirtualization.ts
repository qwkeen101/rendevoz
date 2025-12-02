import { useState, useEffect, useMemo } from 'react'
import { useWhiteboardInstance, useWhiteboard, useWhiteboardSelection, useWhiteboardState } from '../hooks'
import { IWhiteboardTransform, WhiteboardEvent } from '../types/instance'
import { IWhiteboardNode, IWhiteboardEdge } from '../types/whiteboard'

export type UseVirtualizationResult = {
    visibleNodeIds: Set<number>
    visibleEdgeIds: Set<number>
    keepAliveNodeIds: Set<number>
    currentViewport: IWhiteboardTransform
}

export const useVirtualization = (): UseVirtualizationResult => {
    const instance = useWhiteboardInstance()
    const whiteboard = useWhiteboard()
    const selection = useWhiteboardSelection()
    const { virtualization, nodeRenderers, lastViewport } = useWhiteboardState()

    const enabled = virtualization?.enabled ?? true
    const padding = virtualization?.viewportPadding ?? 0.2
    const alwaysRenderSelected = virtualization?.alwaysRenderSelected ?? true
    const debounceMs = virtualization?.debounceMs ?? 16

    // 跟踪当前 viewport（实时更新）
    const [currentViewport, setCurrentViewport] = useState<IWhiteboardTransform>(
        lastViewport || { x: 0, y: 0, scale: 1 }
    )

    // 跟踪 keepAlive 的评估结果
    const [keepAliveNodeIds, setKeepAliveNodeIds] = useState<Set<number>>(new Set())

    // 监听 viewport 变化事件（实时）
    useEffect(() => {
        const handleViewportChange = (event: WhiteboardEvent) => {
            if (event.type === 'viewportChange') {
                setCurrentViewport(event.viewport)
            }
        }

        instance.addEventListener?.('viewportChange', handleViewportChange)
        return () => instance.removeEventListener?.('viewportChange', handleViewportChange)
    }, [instance])

    // 计算扩展视口框（含 padding）
    const expandedViewBox = useMemo(() => {
        const transform = currentViewport
        const containerEl = instance.getOutestContainerNode?.()
        if (!containerEl || !transform) return null

        const containerRect = containerEl.getBoundingClientRect()
        const viewBox = {
            left: (-transform.x) / transform.scale,
            top: (-transform.y) / transform.scale,
            width: containerRect.width / transform.scale,
            height: containerRect.height / transform.scale
        }

        return {
            left: viewBox.left - viewBox.width * padding,
            top: viewBox.top - viewBox.height * padding,
            width: viewBox.width * (1 + padding * 2),
            height: viewBox.height * (1 + padding * 2)
        }
    }, [currentViewport, padding, instance])

    // 计算可见节点 ID
    const visibleNodeIds = useMemo(() => {
        if (!enabled) return new Set(whiteboard.nodes?.keys() || [])
        if (!expandedViewBox) return new Set(whiteboard.nodes?.keys() || [])

        const inViewNodes = Array.from(whiteboard.nodes?.values() || []).filter(node => {
            const nodeBox = {
                left: node.x,
                top: node.y,
                width: node.width ?? 0,
                height: node.height ?? 0
            }
            return !(
                nodeBox.left + nodeBox.width < expandedViewBox.left ||
                nodeBox.left > expandedViewBox.left + expandedViewBox.width ||
                nodeBox.top + nodeBox.height < expandedViewBox.top ||
                nodeBox.top > expandedViewBox.top + expandedViewBox.height
            )
        })

        const ids = new Set(inViewNodes.map(n => n.id))

        // 选中的节点总是渲染
        if (alwaysRenderSelected) {
            selection.nodes.forEach(id => ids.add(id))
        }

        return ids
    }, [whiteboard.nodes, expandedViewBox, selection.nodes, enabled, alwaysRenderSelected])

    // 计算可见边 ID
    const visibleEdgeIds = useMemo(() => {
        if (!enabled) return new Set(whiteboard.edges?.keys() || [])
        if (!expandedViewBox) return new Set(whiteboard.edges?.keys() || [])

        const edges = Array.from(whiteboard.edges?.values() || [])
        const nodes = whiteboard.nodes

        const inViewEdges = edges.filter(edge => {
            // nodes 一定是 Map 类型
            const sourceNode = nodes?.get(edge.sourceId)
            const targetNode = nodes?.get(edge.targetId)

            if (!sourceNode || !targetNode) return false

            // 边的包围盒：source 和 target 的最小外接矩形
            const edgeBox = {
                left: Math.min(sourceNode.x, targetNode.x),
                top: Math.min(sourceNode.y, targetNode.y),
                width: Math.abs(targetNode.x - sourceNode.x) + Math.max(sourceNode.width ?? 0, targetNode.width ?? 0),
                height: Math.abs(targetNode.y - sourceNode.y) + Math.max(sourceNode.height ?? 0, targetNode.height ?? 0)
            }

            return !(
                edgeBox.left + edgeBox.width < expandedViewBox.left ||
                edgeBox.left > expandedViewBox.left + expandedViewBox.width ||
                edgeBox.top + edgeBox.height < expandedViewBox.top ||
                edgeBox.top > expandedViewBox.top + expandedViewBox.height
            )
        })

        const ids = new Set(inViewEdges.map((e: IWhiteboardEdge) => e.id))

        // 选中的边总是渲染
        if (alwaysRenderSelected) {
            selection.edges.forEach((id: number) => ids.add(id))
        }

        return ids
    }, [whiteboard.edges, whiteboard.nodes, expandedViewBox, selection.edges, enabled, alwaysRenderSelected])

    // Debounce 可见节点更新
    const [debouncedVisibleNodeIds, setDebouncedVisibleNodeIds] = useState(visibleNodeIds)
    const [debouncedVisibleEdgeIds, setDebouncedVisibleEdgeIds] = useState(visibleEdgeIds)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedVisibleNodeIds(visibleNodeIds)
            setDebouncedVisibleEdgeIds(visibleEdgeIds)
        }, debounceMs)

        return () => clearTimeout(timer)
    }, [visibleNodeIds, visibleEdgeIds, debounceMs])

    // 评估 keepAlive（支持异步）
    useEffect(() => {
        const evaluateKeepAlive = async () => {
            const newKeepAliveNodes = new Set<number>()
            const nodes = Array.from(whiteboard.nodes?.values() || [])

            for (const node of nodes) {
                const renderer = nodeRenderers?.[node.type]
                if (!renderer || typeof renderer === 'function') continue

                const config = renderer.config
                if (!config?.keepAlive) continue

                let shouldKeepAlive = false

                if (typeof config.keepAlive === 'boolean') {
                    shouldKeepAlive = config.keepAlive
                } else if (typeof config.keepAlive === 'function') {
                    const result = config.keepAlive()
                    shouldKeepAlive = result instanceof Promise ? await result : result
                }

                if (shouldKeepAlive) {
                    newKeepAliveNodes.add(node.id)
                }
            }

            setKeepAliveNodeIds(newKeepAliveNodes)
        }

        evaluateKeepAlive()
    }, [whiteboard.nodes, nodeRenderers])

    return {
        visibleNodeIds: debouncedVisibleNodeIds,
        visibleEdgeIds: debouncedVisibleEdgeIds,
        keepAliveNodeIds,
        currentViewport
    }
}
