import { IWhiteboardEdge, IWhiteboardMindmap, IWhiteboardNode } from '~/typings'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { useState } from 'react'
import { createPortal } from 'react-dom'
import Edge from '@/core/components/whiteboard/edge/Edge'
import dragAllMindmapChildren from '@/core/components/whiteboard/node/mindmap/dragAllMindmapChildren'
import handleNodeDragEnd from '@/core/components/whiteboard/node/mindmap/drag/handleNodeDragEnd'
import removeSubNode from '@/core/components/whiteboard/node/mindmap/removeSubNode'
import { getChildrenOfNode } from '@/core/components/whiteboard/node/mindmap/utils/tree'
import { useRafFn } from '@/hooks'
import { Colors } from '@/consts'

export default (
  node: IWhiteboardNode & { type: 'mindmap' },
  opts: {
    mindmapCoreId: number
    subNodeIds: {
      current: {
        left: Set<number>
        right: Set<number>
      }
    }
    handleRightTreeChange: VoidFunction
    handleLeftTreeChange: VoidFunction
    layoutCache?: {
      current: any
    }
    links: {
      sourceId: number
      targetId: number
      direction: 'left' | 'right'
    }[]
  }
) => {
  const { subNodeIds, mindmapCoreId, layoutCache, links, handleLeftTreeChange, handleRightTreeChange } = opts
  const instance = useWhiteboardInstance()
  const edgeLayer = instance.getEdgeLayer?.()
  const [tempLink, setTempLink] = useState<{
    sourceId: number
    targetId: number
    direction: 'left' | 'right'
    fakeNode?: HTMLElement
  }>()
  const nodeFunc = instance.values.ID_TO_NODE_MAP.get(node.id)
  const raftDragMindmapChildren = useRafFn(dragAllMindmapChildren)
  if (nodeFunc) {
    nodeFunc.hasTempMindmapLink = () => {
      if (tempLink) return true
      return false
    }
    nodeFunc.checkMindmapDrag = (targetNode, dragNode) => {
      // drag self, update children position
      if (dragNode.id === node.id) {
        if (layoutCache?.current) {
          console.log(layoutCache.current)
          raftDragMindmapChildren(
            dragNode,
            instance,
            layoutCache.current,
            links.map(link => `${mindmapCoreId}_${link.sourceId}_${link.targetId}`)
          )
        }
      } else {
        if (
          targetNode &&
          (targetNode.node.id === node.id ||
            subNodeIds.current.right.has(targetNode.node.id) ||
            subNodeIds.current.left.has(targetNode.node.id))
        ) {
          setTempLink({
            sourceId: targetNode.node.id,
            targetId: dragNode.id,
            direction: targetNode.direction
          })
          setTimeout(() => {
            instance.edgeOps?.getEdgeFuncs(node.id)?.drawPath()
          })
        } else {
          if (tempLink) {
            setTempLink(undefined)
          }
        }
      }
    }
    nodeFunc.endDragNode = dragNode => {
      const rightIds = subNodeIds.current.right
      const leftIds = subNodeIds.current.left
      if (tempLink) {
        handleNodeDragEnd({
          currNode: node,
          rightIds,
          link: tempLink,
          leftIds,
          instance,
          dragNode
        })

        setTempLink(undefined)
        return true
      }
      if (dragNode.id === node.id) {
        const ifOtherHaveTempLink = Array.from(instance.values.ID_TO_NODE_MAP.values()).some(i => i.hasTempMindmapLink?.())
        if (!ifOtherHaveTempLink) {
          setTimeout(() => {
            handleRightTreeChange()
            handleLeftTreeChange()
          })
        }
        return false
      }

      if (!tempLink) {
        if (rightIds.has(dragNode.id) || leftIds.has(dragNode.id)) {
          instance.updateWhiteboard?.(w => {
            const newMindmap = removeSubNode({
              node,
              targetNodeId: dragNode.id,
              side: rightIds.has(dragNode.id) ? 'right' : 'left'
            })
            w.nodes?.set(newMindmap.id, newMindmap)
            const dragged = w.nodes?.get(dragNode.id)
            if (dragged) {
              const ifOtherHaveTempLink = Array.from(instance.values.ID_TO_NODE_MAP.entries()).some(
                i => i[0] !== node.id && i[1].hasTempMindmapLink?.()
              )
              if (!ifOtherHaveTempLink) {
                const subChildren = getChildrenOfNode(dragNode, instance, dragNode.side)
                console.log(subChildren, dragNode)
                if (subChildren?.length) {
                  w.nodes?.set(dragged.id, {
                    ...dragged,
                    rootId: undefined,
                    side: undefined,
                    type: 'mindmap',
                    nodeType: dragged.type,
                    edgeColor: node.edgeColor,
                    edgeType: node.edgeType,
                    borderType: node.borderType,
                    border: node.border,
                    rightChildren: dragged.side === 'right' ? subChildren : [],
                    leftChildren: dragged.side === 'left' ? subChildren : []
                  })
                } else {
                  w.nodes?.set(dragged.id, {
                    ...dragged,
                    rootId: undefined,
                    side: undefined
                  })
                }
              }
            }
          }, true)
        }
      }
      return false
    }
  }
  const renderTempLink = () => {
    if (edgeLayer && tempLink) {
      return createPortal(
        <Edge
          isMindmapConnection={true}
          edge={{
            id: node.id,
            sourceId: tempLink.sourceId,
            targetId: tempLink.targetId,
            sourcePosition: tempLink.direction === 'right' ? 'right' : 'left',
            targetPosition: tempLink.direction === 'right' ? 'left' : 'right',
            color: node.edgeColor || Colors.Font.Primary
          }}
          strokeWidth={4}
          hideArrow={true}
          lineType={'curve'}
        />,
        edgeLayer
      )
    }
  }
  return {
    renderTempLink
  }
}
