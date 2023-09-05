import { useSelectAtomValue } from '@/hooks'
import { useWhiteboardState, WhiteboardStateAtom } from '@/core/whiteboard/hooks/useWhiteboardState'
import { useEffect } from 'react'
import { useFlow } from '@/core/whiteboard/hooks'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import UseUpdateWhiteboard from '@/core/whiteboard/hooks/useUpdateWhiteboard'

const useWhiteboardErase = () => {
  const currentTool = useSelectAtomValue(WhiteboardStateAtom, s => s.currentTool)
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const flow = useFlow()
  const updateWhiteboard = UseUpdateWhiteboard()
  useEffect(() => {
    const container = flow.parentContainerEle
    if (container && currentTool === 'erase') {
      const isErasing = {
        current: false,
        whiteboardErasing: false
      }
      const pointerDownHandler = (e: PointerEvent) => {
        if (whiteboardState.isPanning) return
        if (e.button === 0) {
          e.preventDefault()
          e.stopPropagation()
        }
        isErasing.whiteboardErasing = true
        isErasing.current = true
        setWhiteboardState(s => ({ ...s, erasing: true }))
      }
      const keyDownHandler = (e: KeyboardEvent) => {
        if (isHotkey(KEY.Escape, e)) {
          isErasing.whiteboardErasing = false
          setWhiteboardState(s => ({ ...s, erasing: false }))
          flow.erasedEdgeIds.clear()
          flow.erasedNodeIds.clear()
        }
      }
      const pointerUpHandler = () => {
        isErasing.current = false
        isErasing.whiteboardErasing = false
        const erasedNodeIds = Array.from(flow.erasedNodeIds.values())
        const erasedEdgeIds = Array.from(flow.erasedEdgeIds.values())
        updateWhiteboard(w => {
          if (erasedNodeIds.length > 0) {
            flow.erasedNodeIds.clear()
            erasedNodeIds.forEach(id => {
              w.nodes?.delete(id)
              flow.NODE_TO_EDGE_MAP.get(id)?.forEach(i => w.edges?.delete(i))
            })
          }
          if (erasedEdgeIds.length > 0) {
            flow.erasedEdgeIds.clear()
            erasedEdgeIds.forEach(id => {
              w.edges?.delete(id)
            })
          }
        }, true)

        setWhiteboardState(s => ({ ...s, erasing: false }))
      }
      const pointerMoveHandler = () => {
        if (!isErasing.whiteboardErasing && isErasing.current) {
          setWhiteboardState(s => ({ ...s, erasing: true }))
          isErasing.whiteboardErasing = true
        }
      }
      document.addEventListener('keydown', keyDownHandler)
      container.addEventListener('pointermove', pointerMoveHandler)
      container.addEventListener('pointerup', pointerUpHandler)
      container.addEventListener('pointerdown', pointerDownHandler)
      return () => {
        document.removeEventListener('keydown', keyDownHandler)
        container.removeEventListener('pointerdown', pointerDownHandler)
        container.removeEventListener('pointermove', pointerMoveHandler)
        container.removeEventListener('pointerup', pointerUpHandler)
      }
    }
  }, [currentTool])
}

export default useWhiteboardErase
