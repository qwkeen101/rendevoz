import { KEY } from '@/consts'
import { useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { useEffect } from 'react'
import useVideoState from './useVideoState'

const useVideoShortcut = () => {
  const [, setVideoState] = useVideoState()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (isHotkey(KEY.Space, e)) {
      if (
        !(
          e.target instanceof HTMLElement &&
          (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[contenteditable=true]'))
        )
      ) {
        setVideoState(s => ({ ...s, paused: !s.paused }))
      }
    }
    if (isHotkey(KEY.ArrowLeft, e)) {
      setVideoState(s => ({ ...s, currentTime: Math.max((s.currentTime || 0) - 10, 0), jumpIndicator: 'back' }))
    }
    if (isHotkey(KEY.ArrowRight, e)) {
      setVideoState(s => ({ ...s, currentTime: Math.min((s.currentTime || 0) + 10, s.totalTime || 0), jumpIndicator: 'forward' }))
    }
  })
  useEffect(() => {
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
}

export default useVideoShortcut
