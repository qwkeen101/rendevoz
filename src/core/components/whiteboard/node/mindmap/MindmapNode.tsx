import { IWhiteboardMindmap, IWhiteboardNode, XYPosition } from '~/typings'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { RefObject, useEffect, useRef, useState } from 'react'
import drawTempDragLink from '@/core/components/whiteboard/node/mindmap/drawTempDragLink'
import { createPortal } from 'react-dom'
import Edge from '@/core/components/whiteboard/edge/Edge'
import autoArrangeLayout from '@/core/components/whiteboard/node/mindmap/autoArrangeLayout'
import dragAllMindmapChildren from '@/core/components/whiteboard/node/mindmap/dragAllMindmapChildren'
import useKeepMindmapLayout from '@/core/components/whiteboard/node/mindmap/useKeepMindmapLayout'
import { useUpdateEffect } from '@/hooks'
import handleNodeDragEnd from '@/core/components/whiteboard/node/mindmap/handleNodeDragEnd'
import AddSubMindmapIndicator from '@/core/components/whiteboard/node/mindmap/AddSubMindmapIndicator'
import handleAddSubNode from '@/core/components/whiteboard/node/mindmap/handleAddSubNode'
import removeSubNode from '@/core/components/whiteboard/node/mindmap/removeSubNode'

// calculate position based on root
export default ({
  node,
  parentNodeRef
}: {
  node: IWhiteboardNode & { type: 'mindmap' }
  rootMindmapNode?: IWhiteboardNode
  parentNodeRef?: RefObject<HTMLElement>
}) => {
  const instance = useWhiteboardInstance()
  const edgeLayer = instance.getEdgeLayer?.()
  const [links, setLinks] = useState<
    {
      sourceId: number
      targetId: number
      direction: 'left' | 'right'
    }[]
  >([])
  const [tempLink, setTempLink] = useState<{
    sourceId: number
    targetId: number
    direction: 'left' | 'right'
    fakeNode?: HTMLElement
  }>()
  const parentEle = parentNodeRef?.current
  const drawAllEdges = () => {
    links.forEach(l => {
      instance.edgeOps?.getEdgeFuncs(`${l.sourceId}_${l.targetId}`)?.drawPath()
    })
  }
  const getEdges = (ids: Set<number>) => {
    const linkz: typeof links = []
    const traverse = (node: IWhiteboardMindmap, direction: 'right' | 'left') => {
      node.children.forEach(c => {
        const source = instance.getNode?.(node.root)
        const target = instance.getNode?.(c.root)
        if (!(source?.width === undefined || source?.height === undefined || target?.width === undefined || target.height === undefined)) {
          if (ids.has(node.root) && ids.has(c.root)) {
            linkz.push({
              sourceId: node.root,
              targetId: c.root,
              direction
            })
          }
        }
        traverse(c, direction)
      })
    }
    node.rightChildren?.forEach(n => {
      const source = instance.getNode?.(node.id)
      const target = instance.getNode?.(n.root)
      if (!(source?.width === undefined || source?.height === undefined || target?.width === undefined || target.height === undefined)) {
        if (ids.has(node.id) && ids.has(n.root)) {
          linkz.push({
            sourceId: node.id,
            targetId: n.root,
            direction: 'right'
          })
        }
      }
      traverse(n, 'right')
    })
    setLinks(linkz)
  }
  const { handleLeftTreeChange, handleRightTreeChange, layoutCache, allSubNodeIds } = useKeepMindmapLayout(node, {
    drawEdges: drawAllEdges,
    getEdges
  })

  useEffect(() => {
    if (node.leftChildren) {
      handleLeftTreeChange(node.leftChildren)
    }
    if (node.rightChildren) {
      handleRightTreeChange(node.rightChildren)
    }
  }, [node.rightChildren, node.leftChildren])
  const nodeFunc = instance.values.ID_TO_NODE_MAP.get(node.id)

  if (nodeFunc) {
    nodeFunc.checkMindmapDrag = (targetNode, dragNode) => {
      // drag seld, update children position
      if (dragNode.id === node.id) {
        if (layoutCache.current) {
          dragAllMindmapChildren(
            dragNode,
            instance,
            layoutCache.current,
            links.map(link => `${link.sourceId}_${link.targetId}`)
          )
        }
      } else {
        if (
          targetNode &&
          (targetNode.node.id === node.id ||
            allSubNodeIds.current.right.has(targetNode.node.id) ||
            allSubNodeIds.current.left.has(targetNode.node.id))
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
      if (tempLink) {
        setTimeout(() => {
          handleNodeDragEnd({
            currNode: node,
            rightIds: allSubNodeIds.current.right,
            link: tempLink,
            leftIds: allSubNodeIds.current.left,
            instance,
            dragNode
          })
        }, 100)
        setTempLink(undefined)
      }
      if (dragNode.id === node.id) {
        setTimeout(() => {
          node.rightChildren && handleRightTreeChange(node.rightChildren)
          node.leftChildren && handleLeftTreeChange(node.leftChildren)
        }, 10)
      }
      const rightIds = allSubNodeIds.current.right
      const leftIds = allSubNodeIds.current.left
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
              const ifOtherHaveTempLink = Array.from(instance.values.ID_TO_NODE_MAP.values()).some(i => i.hasTempMindmapLink?.())
              if (!ifOtherHaveTempLink) {
                w.nodes?.set(dragged.id, {
                  ...dragged,
                  rootId: undefined,
                  side: undefined
                })
              }
            }
          })
        }
      }
    }
    nodeFunc.onSomeNodeSizeChange = n => {
      console.log(n, node.rightChildren)
      if (allSubNodeIds.current.right.has(n.id) && node.rightChildren) {
        handleRightTreeChange(node.rightChildren)
      }
    }
    nodeFunc.onAddSubNode = (sourceNodeId, newNode, idx, direction) => {
      const newMindmap = handleAddSubNode({
        rightIds: allSubNodeIds.current.right,
        leftIds: allSubNodeIds.current.left,
        currNode: node,
        idx,
        direction,
        newNode: newNode,
        targetId: sourceNodeId
      })
      if (newMindmap) {
        console.log(newMindmap)
        instance.updateNode?.(node.id, n => ({ ...n, ...newMindmap }))
        instance.updateNode?.(newNode.id, n => ({ ...n, rootId: node.id }))
      }
    }
  }
  return (
    <>
      <div>123123123</div>
      {parentEle && createPortal(<AddSubMindmapIndicator node={node} />, parentEle)}
      {edgeLayer &&
        tempLink &&
        createPortal(
          <Edge
            edge={{
              id: node.id,
              sourceId: tempLink.sourceId,
              targetId: tempLink.targetId,
              sourcePosition: tempLink.direction === 'right' ? 'right' : 'left',
              targetPosition: tempLink.direction === 'right' ? 'left' : 'right',
              color: '#ffffff'
            }}
            hideArrow={true}
            lineType={'curve'}
          />,
          edgeLayer
        )}
      {edgeLayer &&
        links &&
        createPortal(
          links.map(link => (
            <Edge
              hideArrow
              key={`${link.sourceId}_${link.targetId}`}
              edge={{
                id: `${link.sourceId}_${link.targetId}`,
                sourceId: link.sourceId,
                targetId: link.targetId,
                sourcePosition: link.direction === 'right' ? 'right' : 'left',
                targetPosition: link.direction === 'right' ? 'left' : 'right',
                color: '#000000'
              }}
              lineType={'curve'}
            />
          )),
          edgeLayer
        )}
    </>
  )
}
