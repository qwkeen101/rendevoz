import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'

const useWhiteboardShortcut = () => {
  const flow = useFlow()
  const instance = useWhiteboardInstance()
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  useEffect(() => {
    const keydownHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
        const target = e.target
        if (
          target instanceof HTMLElement &&
          (target.closest('textarea') || target.closest('input') || target.closest('[contenteditable="true"]'))
        ) {
          return
        }
      }
      if (isHotkey(KEY.Tab, e)) {
        const target = e.target
        if (flow.parentContainerEle?.contains(target)) {
          if (!target.closest?.('input,textarea,[contenteditable]')) {
            console.log('prevent')
            e.preventDefault()
          }
        }
      }
      if (isHotkey(KEY.Escape, e)) {
        console.log(whiteboardState)
        setTimeout(() => {
          if (e.defaultPrevented) return
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
        })
      }
    }
    document.addEventListener('keyup', keydownHandler, true)
    return () => {
      document.removeEventListener('keyup', keydownHandler, true)
    }
  })
}

export default useWhiteboardShortcut
