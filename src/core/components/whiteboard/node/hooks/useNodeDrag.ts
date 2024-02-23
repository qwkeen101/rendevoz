import { Box, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import useGroupDrag from '@/core/components/whiteboard/node/hooks/useGroupDrag'
import { DraggableEvent } from 'react-draggable'
import { DraggableData } from 'react-rnd'
import { useRef } from 'react'
import { boxContain, pointInBox } from '@/utils'
import { getBoxOfBoxes, getBoxOfNodes } from '@/core/components/whiteboard/utils'
import checkAddLinkWhenDrag from '@/core/components/whiteboard/node/mindmap/drag/getClosestNodeLink'
import dragSingleNodeToEnlargeGroup from '@/core/components/whiteboard/node/hooks/drag/dragSingleNodeToEnlargeGroup'

const defaultEnlarge = 24
export default (node: IWhiteboardNode, instance: IWhiteboardInstance) => {
  const { handleGroupMove, handleGroupMoveEnd, handleGroupMoveStart } = useGroupDrag(node, instance)
  const cachedGroupNodes = useRef<IWhiteboardNode[]>()
  const draggedIntoGroups = useRef<IWhiteboardNode[]>()
  const handleDragStart = () => {
    instance.eventEmitter.emit('whiteboard', {
      type: 'nodeDragStart',
      data: {
        draggingNode: node
      }
    })
    if (node.type === 'group') {
      handleGroupMoveStart()
    }
    const allNodes = instance.getAllNode?.()
    cachedGroupNodes.current = allNodes?.filter(i => i.type === 'group')
  }

  const handleDrag = (e: DraggableEvent, data: DraggableData, sendEvent?: boolean) => {
    instance.nodeOps?.updateRelatedEdges(node.id)
    const targetMindmapNode = checkAddLinkWhenDrag({ ...node, x: data.x, y: data.y }, instance, e)
    console.log(targetMindmapNode)
    Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(
      i => i.checkMindmapDrag?.(targetMindmapNode, { ...node, x: data.x, y: data.y })
    )
    const transformedWhiteboardPoint = instance.coordOps?.transformWindowPositionToPosition({
      x: e.clientX,
      y: e.clientY
    })
    let myBox = instance.values.ID_TO_NODE_MAP.get(node.id)?.getRealtimeBox()
    if (node.type === 'mindmap') {
      const allNodes = [node, ...(instance.mindmapOps?.expandMindmap(node) || [])]
      const allBoxes = allNodes.map(i => instance.nodeOps?.getNodeFuncs(i.id)?.getRealtimeBox()).filter(i => i) as Box[]
      myBox = getBoxOfBoxes(allBoxes)
    }
    if (!myBox) return
    draggedIntoGroups.current = []
    // check if dragging into group
    cachedGroupNodes.current?.forEach(i => {
      if (i.id === node.id) return
      const box = {
        left: i.x,
        top: i.y,
        width: i.width,
        height: i.height
      }
      // if node already in group, don't trigger select
      if (!boxContain(box, myBox)) {
        if (pointInBox(transformedWhiteboardPoint, box)) {
          instance.values.ID_TO_NODE_MAP.get(i.id)?.select()
          draggedIntoGroups.current?.push(i)
        } else {
          instance.values.ID_TO_NODE_MAP.get(i.id)?.deselect()
        }
      }else{
        instance.values.ID_TO_NODE_MAP.get(i.id)?.deselect()
      }
    })
    console.log(draggedIntoGroups.current)
    if (node.type === 'group') {
      handleGroupMove(data, data.node)
      throw new Error('')
    } else {
      // 如果链接到导图上，则不snap
      if (sendEvent && !targetMindmapNode) {
        instance.eventEmitter.emit('whiteboard', {
          type: 'nodeDrag',
          data: {
            draggingNode: {
              ...node,
              x: data.x,
              y: data.y
            },
            nodeElement: data.node
          }
        })
      }
    }
  }

  const handleDragEnd = (e: DraggableEvent, data: DraggableData): Box | undefined => {
    cachedGroupNodes.current = undefined
    Array.from(instance.values.ID_TO_NODE_MAP.values()).forEach(i => i.endDragNode?.({ ...node, x: data.x, y: data.y }))
    const availableGroups = draggedIntoGroups.current
    if (availableGroups) {
      dragSingleNodeToEnlargeGroup(node, instance, availableGroups)
      draggedIntoGroups.current = undefined
    }
    instance.eventEmitter.emit('whiteboard', {
      type: 'nodeDragEnd'
    })
    if (node.type === 'group') {
      handleGroupMoveEnd(data)
    } else {
      const box = instance.values.ID_TO_NODE_MAP.get(node.id)?.getRealtimeBox()
      if (box) {
        return box
      }
    }
  }

  return {
    handleDrag,
    handleDragStart,
    handleDragEnd
  }
}
