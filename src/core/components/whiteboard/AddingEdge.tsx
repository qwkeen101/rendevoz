import { useMemoizedFn, useSelectGlobalAtomValue } from '@/hooks'
import Id from '@/utils/id'
import { useEffect, useState } from 'react'
import { getMarkerId } from '../graph/utils/getMarkerId'
import { MarkerColor } from '@/consts'
import { useAddingEdges, useFlow, WhiteboardAtom, WhiteboardEdgesAtom } from './hooks'
import { EdgePosition, IWhiteboardEdge } from '~/typings'
import { getBezierPath, getHandlePosition, transformXY } from './utils'
import { useStore } from 'jotai'
import getSetting from '../../setting/getSetting'
import { MetaStore } from '@/api/stores'
import { disableAllUserSelect } from '@/components/base/ResizeAndDrag'
import { getSmoothPolyPath } from '@/core/components/whiteboard/utils/getSmoothPoly'
import { SettingAtom } from '@/core'
import { animatedEdgeClazz, dashEdgeClazz } from '@/core/components/whiteboard/Edge'
import useUpdateWhiteboard from '@/core/components/whiteboard/hooks/useUpdateWhiteboard'

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
  const [addingEdgeState, setIsAddingEdge] = useAddingEdges()
  const [path, setPath] = useState<string>()
  const [currentEdge, setCurrentEdge] = useState<IWhiteboardEdge>()
  const updateWhiteboard = useUpdateWhiteboard()
  const store = useStore()
  const flow = useFlow()
  const defaultLineType = useSelectGlobalAtomValue(SettingAtom, s => s.whiteboard.defaultLineType)
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    const { clientX, clientY } = e
    const { sourcePosition, sourceNodeId, targetNodeId, targetPosition, currentEdgeId } = addingEdgeState
    if (currentEdgeId && !currentEdge) {
      const e = store.get(WhiteboardEdgesAtom).get(currentEdgeId)
      setCurrentEdge(e)
    }
    const containerBound = flow.containerEle?.getBoundingClientRect()
    // reposition, maybe drag source or target

    let transformedTargetXY, targetHandlePos
    let transformedSourceXY, sourceHandlePos

    if (targetNodeId && targetPosition) {
      targetHandlePos = targetPosition
      const targetXY = getHandlePosition(targetNodeId, targetPosition, flow)
      if (!targetXY) return
      transformedTargetXY = transformXY(containerBound, targetXY?.x, targetXY?.y, flow.containerTransformScale)
    } else {
      transformedTargetXY = transformXY(containerBound, clientX, clientY, flow.containerTransformScale)
    }

    if (sourceNodeId && sourcePosition) {
      sourceHandlePos = sourcePosition
      const sourceXY = getHandlePosition(sourceNodeId, sourcePosition, flow)
      if (!sourceXY) return
      transformedSourceXY = transformXY(containerBound, sourceXY.x, sourceXY.y, flow.containerTransformScale)
    } else {
      transformedSourceXY = transformXY(containerBound, clientX, clientY, flow.containerTransformScale)
    }
    if (sourceHandlePos && !targetHandlePos) {
      const sourceHandlePosition = getHandlePosition(sourceNodeId, sourcePosition, flow)
      targetHandlePos = getTargetPosition(
        {
          x: sourceHandlePosition?.x,
          y: sourceHandlePosition?.y
        },
        {
          x: clientX,
          y: clientY
        }
      )
    }
    if (targetHandlePos && !sourceHandlePos) {
      const targetHandlePosition = getHandlePosition(targetNodeId, targetPosition, flow)
      if (targetHandlePosition!.x < clientX) {
        sourceHandlePos = 'left'
      } else {
        sourceHandlePos = 'right'
      }
    }
    if (transformedTargetXY && transformedSourceXY) {
      let path = []
      const lineType = currentEdge?.lineType || defaultLineType
      if (lineType === 'curve') {
        path = getBezierPath({
          sourceX: transformedSourceXY.x,
          sourceY: transformedSourceXY.y,
          targetX: transformedTargetXY.x,
          targetY: transformedTargetXY.y,
          sourcePosition: sourceHandlePos,
          targetPosition: targetHandlePos
        })
      } else if (lineType === 'polyline') {
        path = getSmoothPolyPath({
          sourceX: transformedSourceXY.x,
          sourceY: transformedSourceXY.y,
          targetX: transformedTargetXY.x,
          targetY: transformedTargetXY.y,
          sourcePosition: sourceHandlePos,
          targetPosition: targetHandlePos,
          borderRadius: 5
        })
      } else {
        path = [`M ${transformedSourceXY.x},${transformedSourceXY.y} L ${transformedTargetXY.x},${transformedTargetXY.y}`]
      }
      setPath(path[0])
    }
  })
  const pointerUpHandler = useMemoizedFn(() => {
    setIsAddingEdge({
      isAdding: false,
      isReposition: false
    })
    setCurrentEdge(undefined)
    if (addingEdgeState.sourceNodeId && addingEdgeState.sourcePosition && addingEdgeState.targetNodeId && addingEdgeState.targetPosition) {
      if (addingEdgeState.sourceNodeId === addingEdgeState.targetNodeId) return
      updateWhiteboard(w => {
        const edges = w.edges
        if (!edges) return
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

        if (addingEdgeState.isReposition) {
          if (!addingEdgeState.currentEdgeId) return
          const currentRepoEdge = edges.get(addingEdgeState.currentEdgeId)
          if (!currentRepoEdge) return
          edges.set(currentRepoEdge.id, {
            ...currentRepoEdge,
            id: currentRepoEdge.id,
            sourceId: addingEdgeState.sourceNodeId,
            targetId: addingEdgeState.targetNodeId,
            sourcePosition: addingEdgeState.sourcePosition,
            targetPosition: addingEdgeState.targetPosition
          })
        } else {
          const id = Id.getId()
          edges.set(id, {
            id,
            sourceId: addingEdgeState.sourceNodeId!,
            sourcePosition: addingEdgeState.sourcePosition,
            targetId: addingEdgeState.targetNodeId!,
            targetPosition: addingEdgeState.targetPosition
          })
        }
      }, true)

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
    if (addingEdgeState.isAdding || addingEdgeState.isReposition) {
      document.addEventListener('pointermove', pointerMoveHandler)
      document.addEventListener('pointerup', pointerUpHandler)
      window.getSelection()?.empty()
      document.body.classList.add(disableAllUserSelect)
      flow.isAddingEdge = true
      return () => {
        document.removeEventListener('pointermove', pointerMoveHandler)
        document.removeEventListener('pointerup', pointerUpHandler)
        document.body.classList.remove(disableAllUserSelect)
      }
    } else {
      flow.isAddingEdge = false
      setPath(undefined)
    }
  }, [addingEdgeState.isAdding, addingEdgeState.isReposition])

  return (
    <g>
      <path
        className={
          currentEdge?.lineStyle === 'animatedDash' ? animatedEdgeClazz : currentEdge?.lineStyle === 'dash' ? dashEdgeClazz : undefined
        }
        fill="none"
        markerEnd={`url(#${getMarkerId('end', currentEdge?.color || MarkerColor.LIGHTGREY)})`}
        stroke={currentEdge?.color || MarkerColor.LIGHTGREY}
        d={path}
        strokeWidth={2}
      ></path>
    </g>
  )
}

export default AddingEdge
