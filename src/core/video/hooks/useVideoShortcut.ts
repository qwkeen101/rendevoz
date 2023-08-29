import { KEY } from '@/consts'
import { useMemoizedFn } from '@/hooks'
import isHotkey, { compareHotkey } from 'is-hotkey'
import { RefObject, useEffect } from 'react'
import useVideoState from './useVideoState'
import { getSetting } from '@/core'
import { useVideoInstance } from '@/core/video/hooks/useVideoInstance'

const useVideoShortcut = (containerRef: RefObject<HTMLElement>) => {
  const [, setVideoState] = useVideoState()
  const instance = useVideoInstance()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    const setting = getSetting()
    const shortcut = setting.shortcut.makeVideoLabel
    if (
      shortcut &&
      e.key === shortcut.key &&
      e.shiftKey === shortcut.shiftKey &&
      e.ctrlKey === shortcut.ctrlKey &&
      e.altKey === shortcut.altKey &&
      e.metaKey === shortcut.metaKey
    ) {
      const time = instance.getVideoState?.().currentTime
      if (time) {
        instance.insertLabel?.({
          videoTime: time
        })
      }
    }
    if (isHotkey(KEY.Space, e)) {
      if (
        !(
          e.target instanceof HTMLElement &&
          (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[contenteditable=true]'))
        )
      ) {
        e.preventDefault()
        setVideoState(s => ({ ...s, paused: !s.paused }))
      }
    }
    if (isHotkey(KEY.ArrowLeft, e)) {
      e.stopPropagation()
      setVideoState(s => ({
        ...s,
        jumpTime: Math.max((s.currentTime || 0) - 5, 0),
        jumpIndicator: 'back'
      }))
      e.preventDefault()
    }
    if (isHotkey(KEY.ArrowRight, e)) {
      e.stopPropagation()
      e.preventDefault()
      setVideoState(s => ({
        ...s,
        jumpTime: Math.min((s.currentTime || 0) + 5, s.totalTime || 0),
        jumpIndicator: 'forward'
      }))
    }
    if (isHotkey(KEY.ArrowDown, e)) {
      e.stopPropagation()
      e.preventDefault()
      setVideoState(s => ({
        ...s,
        volume: Math.max(0, s.volume - 0.05),
        volumeIndicator: 'down'
      }))
    }
    if (isHotkey(KEY.ArrowUp, e)) {
      e.preventDefault()
      e.stopPropagation()
      setVideoState(s => ({
        ...s,
        volume: Math.min(0.6, s.volume + 0.05),
        volumeIndicator: 'up'
      }))
    }
  })
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', keydownHandler)
      return () => {
        container.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [containerRef])
}

export default useVideoShortcut
