import { Box, IWhiteboardInstance } from '~/typings'
import { useRafFn } from '@/hooks'
import { Position } from '@/types'
import { useRef } from 'react'
import { DraggableData } from 'react-rnd'
import { IWhiteboardNode } from '~/typings/data'

const boxContain = (parentBox: Box, childBox: Box) => {
  return (
    parentBox.left < childBox.left &&
    parentBox.top < childBox.top &&
    parentBox.left + parentBox.width > childBox.left + childBox.width &&
    parentBox.top + parentBox.height > childBox.top + childBox.height
  )
}
const useGroupDrag = (node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  const inGroupNodeIdsRef = useRef<number[]>([])
  const { width, height, x, y } = node
  const inGroupNodesOffsetMapRef = useRef(new Map<number, Position>())
  const handleGetInGroupNodes = () => {
    const inGroupNodes = instance.groupOps?.getNodesInGroup(node.id)
    if (!inGroupNodes?.length) return
    inGroupNodes.forEach(n => {
      if (n.type === 'mindmap') {
        const expanded = instance.mindmapOps?.expandMindmap(n)
        console.log(expanded)
        expanded?.forEach(o => inGroupNodes.push(o))
      }
    })
    const inGroupNodesIds: number[] = Array.from(new Set(inGroupNodes.map(i => i.id)).values())
    const inGroupNodesOffsetMap = inGroupNodesOffsetMapRef.current
    inGroupNodes.forEach(n => {
      const offset: Position = {
        left: n.x - x,
        top: n.y - y
      }
      inGroupNodesOffsetMap.set(n.id, offset)
    })
    inGroupNodeIdsRef.current = inGroupNodesIds
  }
  const handleGroupMoveStart = () => {
    handleGetInGroupNodes()
  }
  const handleGroupMove = (data: DraggableData, container: HTMLElement) => {
    const map = inGroupNodesOffsetMapRef.current
    container.style.setProperty('transform', `translate(${data.x}px,${data.y}px)`)
    inGroupNodeIdsRef.current.forEach(id => {
      const node = instance.getNode?.(id)
      if (!node) return
      if (node.rootId && !inGroupNodesOffsetMapRef.current.has(node.rootId)) return
      if (node.type === 'mindmap') {
        instance.mindmapOps?.updateMindmapEdges(node.id)
      }
      const offset = map.get(id)
      if (offset?.top !== undefined && offset.left !== undefined) {
        const nodeFunc = instance.values.ID_TO_NODE_MAP.get(id)
        if (nodeFunc) {
          nodeFunc.setStyle({
            transform: `translate(${data.x + offset.left}px, ${data.y + offset.top}px)`
          })
          instance.nodeOps?.updateRelatedEdges(id)
        }
      }
    })
  }
  const rafGroupMove = useRafFn(handleGroupMove)
  const handleGroupMoveEnd = (data: DraggableData) => {
    const map = inGroupNodesOffsetMapRef.current
    instance.updateWhiteboard?.(w => {
      inGroupNodeIdsRef.current.forEach(id => {
        const node = w.nodes?.get(id)
        if (!node) return
        if (node.rootId && !inGroupNodesOffsetMapRef.current.has(node.rootId)) return
        if (node) {
          const offset = map.get(id)
          if (offset) {
            const newNode: IWhiteboardNode = {
              ...node,
              x: data.x + offset.left,
              y: data.y + offset.top
            }
            w.nodes?.set(id, newNode)
          }
        }
      })
      w.nodes?.set(node.id, {
        ...node,
        x: data.x,
        y: data.y
      })
    })
  }
  return {
    handleGroupMoveStart,
    handleGroupMove: rafGroupMove,
    handleGroupMoveEnd
  }
}

export default useGroupDrag
