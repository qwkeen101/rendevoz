import { Box, IWhiteboardInstance, IWhiteboardNode } from '~/typings'
import useGroupDrag from '@/core/components/whiteboard/node/hooks/useGroupDrag'
import { DraggableEvent } from 'react-draggable'
import { DraggableData } from 'react-rnd'
import { useRef } from 'react'
import { boxContain, pointInBox } from '@/utils'
import { getBoxOfNodes } from '@/core/components/whiteboard/utils'

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
    const transformedWhiteboardPoint = instance.coordOps?.transformWindowPositionToPosition({
      x: e.clientX,
      y: e.clientY
    })
    const myBox = instance.values.ID_TO_NODE_MAP.get(node.id)?.getRealtimeBox()
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
      }
    })
    if (node.type === 'group') {
      handleGroupMove(data, data.node)
      throw new Error('')
    } else {
      if (sendEvent) {
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
    const currentBox = instance.values.ID_TO_NODE_MAP.get(node.id)?.getRealtimeBox()
    if (draggedIntoGroups.current?.length && currentBox) {
      const newGroups = draggedIntoGroups.current
        ?.map(g => {
          const inGroupNodes = instance.groupOps?.getNodesInGroup(g.id, true) || []
          const newBounding = getBoxOfNodes([
            ...inGroupNodes,
            {
              ...node,
              x: currentBox.left,
              y: currentBox.top,
              height: currentBox.height,
              width: currentBox.width
            }
          ])
          if (newBounding) {
            if (newBounding.left + newBounding.width > g.x + g.width) {
              newBounding.width += defaultEnlarge
            }
            if (newBounding.top + newBounding.height > g.y + g.height) {
              newBounding.height += defaultEnlarge
            }
            if (newBounding.left < g.x) {
              newBounding.left -= defaultEnlarge
              newBounding.width += 2 * defaultEnlarge
            }
            if (newBounding.top < g.y) {
              newBounding.top -= defaultEnlarge
              newBounding.height += 2 * defaultEnlarge
            }

            return {
              enlarged: newBounding,
              id: g.id
            }
          }
        })
        .filter(i => i)
      if (newGroups.length) {
        instance.updateWhiteboard?.(w => {
          newGroups.forEach(g => {
            const origin = w.nodes?.get(g.id)
            if (origin) {
              w.nodes?.set(g.id, {
                ...origin,
                x: g.enlarged.left,
                y: g.enlarged.top,
                width: g.enlarged.width,
                height: g.enlarged.height
              })
            }
          })
        }, true)
      }
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
