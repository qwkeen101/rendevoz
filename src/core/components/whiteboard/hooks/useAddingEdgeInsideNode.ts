import { useAddingEdges, useFlow } from '@/core/components/whiteboard/hooks'
import { useEffect, useRef } from 'react'
import { IWhiteboardNode } from '~/typings'
import { getRelativeHandlePosition } from '@/core/components/whiteboard/utils'
import { useMemoizedFn } from '@/hooks'

const useAddingEdgeInsideNode = (node: IWhiteboardNode, container?: HTMLElement | null) => {
  const [addingEdgeState, setAddingEdgeState] = useAddingEdges()
  const innerNodeIdsRef = useRef(new Set<number>())
  const { id, width, type, height, x, y } = node
  const flow = useFlow()
  const getInGroupNodes = () => {
    if (innerNodeIdsRef.current.size > 0) return
    if (type === 'group' && width && height) {
      flow.ID_TO_NODE_ELEMENT_MAP.forEach((node, id) => {
        if (
          node.boxIntersect({
            width,
            height,
            left: x,
            top: y
          })
        ) {
          innerNodeIdsRef.current.add(id)
        }
      })
    }
  }
  const pointerMoveHandler = useMemoizedFn((e: PointerEvent) => {
    if (!container || !addingEdgeState) return
    getInGroupNodes()
    const { isAdding, isReposition, currentRepositionEnd } = addingEdgeState
    if (isAdding) {
      if (addingEdgeState.sourceNodeId && innerNodeIdsRef.current.has(addingEdgeState.sourceNodeId)) {
        setAddingEdgeState(s => ({
          ...s,
          targetNodeId: undefined,
          targetPosition: undefined
        }))
        return
      }
    }
    if (isReposition) {
      if (currentRepositionEnd === 'target' && addingEdgeState.sourceNodeId && innerNodeIdsRef.current.has(addingEdgeState.sourceNodeId)) {
        setAddingEdgeState(s => ({ ...s, targetNodeId: undefined, targetPosition: undefined }))
        return
      }
      if (currentRepositionEnd === 'source' && addingEdgeState.targetNodeId && innerNodeIdsRef.current.has(addingEdgeState.targetNodeId)) {
        setAddingEdgeState(s => ({ ...s, sourceNodeId: undefined, sourcePosition: undefined }))
        return
      }
    }
    const containerBound = container.getBoundingClientRect()
    const position = getRelativeHandlePosition(
      {
        width: containerBound.width,
        height: containerBound.height
      },
      {
        x: e.clientX - containerBound.x,
        y: e.clientY - containerBound.y
      }
    )
    if (isReposition) {
      if (currentRepositionEnd === 'source') {
        setAddingEdgeState(s => ({ ...s, sourcePosition: position, sourceNodeId: id }))
        return
      }
    }
    if (isAdding || isReposition) {
      setAddingEdgeState(s => ({
        ...s,
        targetPosition: position,
        targetNodeId: node.id
      }))
    }
  })
  useEffect(() => {
    if (!container) return
    if (addingEdgeState.isAdding || addingEdgeState.isReposition) {
      const pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerenter') {
          getInGroupNodes()
          if (addingEdgeState.isReposition && addingEdgeState.currentRepositionEnd === 'source') {
            setAddingEdgeState(s => ({ ...s, sourceNodeId: id }))
            return
          } else {
            setAddingEdgeState(s => ({
              ...s,
              targetNodeId: id
            }))
          }
        }
        if (e.type === 'pointerleave') {
          if (addingEdgeState.isReposition && addingEdgeState.currentRepositionEnd === 'source') {
            setAddingEdgeState(s => ({ ...s, sourceNodeId: undefined }))
            return
          }
          setAddingEdgeState(s => ({
            ...s,
            targetNodeId: undefined
          }))
        }
        if (e.type === 'pointerup') {
          setAddingEdgeState({
            isAdding: false,
            isReposition: false
          })
        }
      }
      container.addEventListener('pointermove', pointerMoveHandler)
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      document.addEventListener('pointerup', pointerHandler)
      return () => {
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
        document.removeEventListener('pointerup', pointerHandler)
        container.removeEventListener('pointermove', pointerMoveHandler)
      }
    }
  }, [addingEdgeState.isAdding, addingEdgeState.isReposition])
  return {
    shouldDisplayCover: addingEdgeState.isAdding || addingEdgeState.isReposition,
    groupEnablePointer: addingEdgeState.sourceNodeId ? !innerNodeIdsRef.current.has(addingEdgeState.sourceNodeId) : true
  }
}

export default useAddingEdgeInsideNode
