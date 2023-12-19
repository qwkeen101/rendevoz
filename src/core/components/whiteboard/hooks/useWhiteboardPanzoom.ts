import { useFlow } from '@/core/components/whiteboard/StateHooks'
import { useEffect } from 'react'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import eraserImage from '@/assets/images/eraser.svg'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'

const useWhiteboardPanzoom = () => {
  const flow = useFlow()

  const [whiteboardState, setWhiteboardState] = useWhiteboardState()

  let containerCursor = 'default'
  if (whiteboardState.currentTool) {
    containerCursor = 'crosshair'
  }
  if (whiteboardState.isPanning) {
    containerCursor = 'grabbing'
  } else {
    if (whiteboardState.pointerMode === 'pan') {
      containerCursor = 'grab'
    }
  }
  const instance = useWhiteboardInstance()
  useEffect(() => {
    const container = flow.parentContainerEle
    // middle button can move the whiteboard whatever state it is
    const middleButtonPressed = {
      current: false
    }
    const spacePressed = {
      current: false
    }
    const keyHandler = (e: KeyboardEvent) => {
      if (e.type === 'keydown' && isHotkey(KEY.Space, e)) {
        spacePressed.current = true
        setWhiteboardState(s => ({ ...s, pointerMode: 'pan' }))
      }
      if (e.type === 'keyup') {
        if (!middleButtonPressed.current && spacePressed.current) {
          setWhiteboardState(s => ({ ...s, pointerMode: s.toolbarPointerMode }))
        }
        spacePressed.current = false
      }
    }
    const pointerDownUpHandler = (e: PointerEvent) => {
      if (e.type === 'pointermove' && (e.buttons === 2 || e.buttons === 4)) {
        if (middleButtonPressed.current === false) {
          setWhiteboardState(s => ({ ...s, isPanning: true, pointerMode: 'pan', panStartTransform: instance.getTransform?.() }))
          middleButtonPressed.current = true
        }
      }
      if (e.type === 'pointerup') {
        middleButtonPressed.current = false
        setWhiteboardState(s => ({ ...s, isPanning: false, pointerMode: s.toolbarPointerMode }))
      }
    }
    if (container) {
      document.addEventListener('keydown', keyHandler)
      document.addEventListener('keyup', keyHandler)
      container.addEventListener('pointermove', pointerDownUpHandler)
      container.addEventListener('pointerup', pointerDownUpHandler)
      return () => {
        document.removeEventListener('keydown', keyHandler)
        document.removeEventListener('keyup', keyHandler)
        container.removeEventListener('pointermove', pointerDownUpHandler)
        container.removeEventListener('pointerup', pointerDownUpHandler)
      }
    }
  }, [])

  useEffect(() => {
    const container = flow.parentContainerEle
    if (container && whiteboardState.pointerMode) {
      container.setAttribute('data-pointer-mode', whiteboardState.pointerMode)
    }
    container?.setAttribute('data-is-panning', whiteboardState.isPanning ? 'true' : 'false')
    if (whiteboardState.pointerMode === 'pan' && container) {
      const pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerdown') {
          setWhiteboardState(s => ({ ...s, isPanning: true }))
        } else {
          setWhiteboardState(s => ({ ...s, isPanning: false }))
        }
      }
      container.addEventListener('pointerdown', pointerHandler)
      container.addEventListener('pointerup', pointerHandler)
      return () => {
        container.removeEventListener('pointerdown', pointerHandler)
        container.removeEventListener('pointerup', pointerHandler)
      }
    }
  }, [whiteboardState.pointerMode, whiteboardState.isPanning])
  return {
    containerCursor
  }
}

export default useWhiteboardPanzoom
