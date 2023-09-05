import { useFlow } from '@/core/whiteboard/hooks'
import { useEffect } from 'react'
import { useWhiteboardState } from '@/core/whiteboard/hooks/useWhiteboardState'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import eraserImage from '@/assets/images/eraser.svg?raw'

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
      if (e.type === 'pointerdown' && e.button === 1) {
        setWhiteboardState(s => ({ ...s, isPanning: true }))
        middleButtonPressed.current = true
      }
      if (e.type === 'pointerup') {
        middleButtonPressed.current = false
        setWhiteboardState(s => ({ ...s, isPanning: false }))
      }
    }
    if (container) {
      document.addEventListener('keydown', keyHandler)
      document.addEventListener('keyup', keyHandler)
      container.addEventListener('pointerdown', pointerDownUpHandler)
      container.addEventListener('pointerup', pointerDownUpHandler)
    }
  }, [])

  // useEffect(() => {
  //   if (whiteboardState.isPanning) {
  //     flow.panzoom?.resume()
  //   }
  //   if (whiteboardState.currentTool === 'freehand' || whiteboardState.currentTool === 'erase') {
  //     if (whiteboardState.isPanning) {
  //       flow.panzoom?.resume()
  //     } else {
  //       flow.panzoom?.pause()
  //     }
  //   }
  // }, [whiteboardState.isPanning, whiteboardState.currentTool])

  useEffect(() => {
    const container = flow.parentContainerEle
    if (container && whiteboardState.pointerMode) {
      container.setAttribute('data-pointer-mode', whiteboardState.pointerMode)
    }
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
  }, [whiteboardState.pointerMode])
  return {
    containerCursor
  }
}

export default useWhiteboardPanzoom
