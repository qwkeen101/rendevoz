import { useFlow } from '@/core/whiteboard/hooks'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useWhiteboardInstance } from '@/core/whiteboard/hooks/useWhiteboardInstance'
import { useWhiteboardState } from '@/core/whiteboard/hooks/useWhiteboardState'

const useWhiteboardShortcut = () => {
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
        if (flow.selectedNodeIds.size) {
          instance.deleteNodes?.(Array.from(flow.selectedNodeIds.values()))
          flow.selectedNodeIds.clear()
        }
        flow.clearSelectBox?.()
      }
      if (isHotkey(KEY.Escape, e)) {
        console.log(whiteboardState)
        if (whiteboardState.currentTool !== undefined) {
          if (whiteboardState.currentTool === 'freehand') {
            if (!whiteboardState.freeDrawing) {
              setWhiteboardState(s => ({ ...s, currentTool: undefined }))
            }
          }
          if (whiteboardState.currentTool === 'erase') {
            if (!whiteboardState.erasing) {
              setWhiteboardState(s => ({ ...s, currentTool: undefined }))
            }
          }
        }
      }
    }
    document.addEventListener('keydown', keydownHandler, true)
    return () => {
      document.removeEventListener('keydown', keydownHandler, true)
    }
  })
}

export default useWhiteboardShortcut
