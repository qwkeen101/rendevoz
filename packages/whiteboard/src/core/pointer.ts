import { useEffect } from 'react'
import { IWhiteboardInstance } from '../types'
import { WhiteboardStateAtom } from './store'
import { useStore } from 'jotai'

export const usePointerBridge = (instance: IWhiteboardInstance) => {
  const store = useStore()
  useEffect(() => {
    const handlePointerDown = (e: PointerEvent) => {
      const state = store.get(WhiteboardStateAtom)
      if (state.readOnly) return
      instance.setFocused?.(true)
      instance.emit?.({ type: 'pointerdown', e })
    }
    const handlePointerMove = (e: PointerEvent) => {
      instance.emit?.({ type: 'pointermove', e })
    }
    const handlePointerUp = (e: PointerEvent) => {
      instance.emit?.({ type: 'pointerup', e })
    }
    window.addEventListener('pointerdown', handlePointerDown)
    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
    return () => {
      window.removeEventListener('pointerdown', handlePointerDown)
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)
    }
  }, [instance, store])
}
