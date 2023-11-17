import { Box } from '@/components/dragSelector'
import { useRafFn } from '@/hooks'
import { Position } from '@/types'
import produce from 'immer'
import { useRef } from 'react'
import { DraggableData } from 'react-rnd'
import { IWhiteboardNode } from '~/typings/data'
import { useFlow, useSetWhiteboardNodes } from '../../hooks'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'

const boxContain = (parentBox: Box, childBox: Box) => {
  return (
    parentBox.left < childBox.left &&
    parentBox.top < childBox.top &&
    parentBox.left + parentBox.width > childBox.left + childBox.width &&
    parentBox.top + parentBox.height > childBox.top + childBox.height
  )
}
const useGroupDrag = (node: IWhiteboardNode) => {
  const inGroupNodeIdsRef = useRef<number[]>([])
  const { width, height, x, y } = node
  const flow = useFlow()
  const inGroupNodesOffsetMapRef = useRef(new Map<number, Position>())

  const updateWhiteboard = useUpdateWhiteboard()
  const handleGetInGroupNodes = () => {
    if (width && height) {
      const groupBox: Box = {
        left: x,
        top: y,
        width,
        height
      }
      const inGroupNodesIds: number[] = []
      const inGroupNodesOffsetMap = inGroupNodesOffsetMapRef.current
      flow.ID_TO_NODE_ELEMENT_MAP.forEach((i, id) => {
        const inode = i.getNode()
        if (
          inode.width &&
          inode.height &&
          boxContain(groupBox, {
            left: inode.x,
            top: inode.y,
            width: inode.width,
            height: inode.height
          })
        ) {
          inGroupNodesIds.push(id)
          const node = i.getNode()
          const offset: Position = {
            left: node.x - groupBox.left,
            top: node.y - groupBox.top
          }
          inGroupNodesOffsetMap.set(id, offset)
        }
      })
      inGroupNodeIdsRef.current = inGroupNodesIds
    }
  }
  const handleGroupMoveStart = () => {
    handleGetInGroupNodes()
  }
  const handleGroupMove = (data: DraggableData, container: HTMLElement) => {
    const map = inGroupNodesOffsetMapRef.current
    container.style.setProperty('transform', `translate(${data.x}px,${data.y}px)`)
    inGroupNodeIdsRef.current.forEach(id => {
      const nodeEle = flow.ID_TO_NODE_ELEMENT_MAP.get(id)?.element
      if (nodeEle) {
        const offset = map.get(id)
        if (offset?.top !== undefined && offset.left !== undefined) {
          nodeEle.style.setProperty('transform', `translate(${data.x + offset.left}px, ${data.y + offset.top}px)`)
          flow.NODE_TO_EDGE_MAP.get(id)?.forEach(l => flow.ID_TO_EDGE_MAP.get(l)?.drawPath())
        }
      }
    })
  }
  const rafGroupMove = useRafFn(handleGroupMove)
  const handleGroupMoveEnd = (data: DraggableData) => {
    const map = inGroupNodesOffsetMapRef.current
    updateWhiteboard(w => {
      inGroupNodeIdsRef.current.forEach(id => {
        const node = w.nodes?.get(id)
        if (node) {
          const offset = map.get(id)
          const newNode: IWhiteboardNode = {
            ...node,
            x: data.x + offset.left,
            y: data.y + offset.top
          }
          w.nodes?.set(id, newNode)
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
