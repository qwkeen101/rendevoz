import { useMemoizedFn } from '@/hooks'
import Id from '@/utils/id'
import produce from 'immer'
import { useEffect, useState } from 'react'
import { getMarkerId } from '../graph/utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { useAddingEdges, useFlow, useSetWhiteboardEdges, WhiteboardAtom } from './hooks'
import { EdgePosition } from '../../../typings/data/whiteboard'
import { getBezierPath, getHandlePosition, getNodeData, transformXY } from './utils'
import { useStore } from 'jotai'
import getSetting from '../setting/getSetting'
import { MetaStore } from '@/stores'

const getTargetPosition = (
  sourcePosition: {
    x: number
    y: number
  },
  targetPosition: {
    x: number
    y: number
  }
): EdgePosition => {
  const { x: sourceX } = sourcePosition
  const { x: targetX } = targetPosition
  if (sourceX < targetX) {
    return 'left'
  } else {
    return 'right'
  }
}
const AddingEdge = () => {
  const [addingEdgeState] = useAddingEdges()
  const [path, setPath] = useState<string>()
  const setEdges = useSetWhiteboardEdges()
  const store = useStore()
  const flow = useFlow()
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    const { clientX, clientY } = e
    if (!addingEdgeState.sourceNodeId || !addingEdgeState.sourcePosition) return

    const { sourcePosition, sourceNodeId, targetNodeId, targetPosition } = addingEdgeState
    const containerBound = flow.containerEle?.getBoundingClientRect()
    let transformedTargetXY
    if (targetNodeId && targetPosition) {
      const targetXY = getHandlePosition(targetNodeId, targetPosition, flow)
      if (!targetXY) return
      transformedTargetXY = transformXY(containerBound, targetXY?.x, targetXY?.y, flow.containerTransformScale)
    } else {
      transformedTargetXY = transformXY(containerBound, clientX, clientY, flow.containerTransformScale)
    }
    const sourceHandlePosition = getHandlePosition(sourceNodeId, sourcePosition, flow)
    const targetHandlePosition =
      targetNodeId && targetPosition
        ? targetPosition
        : getTargetPosition(
            {
              x: sourceHandlePosition?.x,
              y: sourceHandlePosition?.y
            },
            {
              x: clientX,
              y: clientY
            }
          )
    if (!sourceHandlePosition) return
    const transformedSourceXY = transformXY(containerBound, sourceHandlePosition.x, sourceHandlePosition.y, flow.containerTransformScale)
    if (transformedTargetXY && transformedSourceXY) {
      const path = getBezierPath({
        sourceX: transformedSourceXY.x,
        sourceY: transformedSourceXY.y,
        targetX: transformedTargetXY.x,
        targetY: transformedTargetXY.y,
        sourcePosition: addingEdgeState.sourcePosition,
        targetPosition: targetHandlePosition
      })
      setPath(path[0])
    }
  })
  const pointerUpHandler = useMemoizedFn(() => {
    if (addingEdgeState.sourceNodeId && addingEdgeState.sourcePosition && addingEdgeState.targetNodeId && addingEdgeState.targetPosition) {
      setEdges(edges => {
        if (
          Array.from(edges.values()).some(
            i =>
              i.sourceId === addingEdgeState.sourceNodeId &&
              i.targetId === addingEdgeState.targetNodeId &&
              i.sourcePosition === addingEdgeState.sourcePosition &&
              i.targetPosition === addingEdgeState.targetPosition
          )
        ) {
          return edges
        }
        return produce(edges, draft => {
          const id = Id.getId()
          draft.set(id, {
            id,
            sourceId: addingEdgeState.sourceNodeId!,
            sourcePosition: addingEdgeState.sourcePosition,
            targetId: addingEdgeState.targetNodeId!,
            targetPosition: addingEdgeState.targetPosition
          })
          console.log(draft)
        })
      })
      const whiteboard = store.get(WhiteboardAtom)
      const sourceNode = whiteboard?.nodes?.get(addingEdgeState.sourceNodeId)
      const targetNode = whiteboard?.nodes?.get(addingEdgeState.targetNodeId)
      if (sourceNode && targetNode && getSetting().whiteboard.enableAddLinkBetweenObjectsWhenConnect) {
        if (sourceNode.type === 'metaObject' && targetNode.type === 'metaObject') {
          MetaStore.addMetaLink({
            sourceId: sourceNode.metaObjectId,
            targetId: targetNode.metaObjectId
          })
        }
      }
    }
  })
  useEffect(() => {
    if (addingEdgeState.isAdding) {
      document.addEventListener('pointermove', pointerMoveHandler)
      document.addEventListener('pointerup', pointerUpHandler)
      flow.isAddingEdge = true
      return () => {
        document.removeEventListener('pointermove', pointerMoveHandler)
        document.removeEventListener('pointerup', pointerUpHandler)
      }
    } else {
      flow.isAddingEdge = false
      setPath(undefined)
    }
  }, [addingEdgeState.isAdding])

  return (
    <g>
      <path
        fill="none"
        markerEnd={`url(#${getMarkerId('end', MarkerColor.LIGHTGREY)})`}
        stroke={MarkerColor.LIGHTGREY}
        d={path}
        strokeWidth={2}
      ></path>
    </g>
  )
}

export default AddingEdge
