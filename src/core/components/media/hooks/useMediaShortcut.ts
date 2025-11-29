import { KEY } from '@/consts'
import { useMemoizedFn } from '@/hooks'
import isHotkey from 'is-hotkey'
import { RefObject, useEffect } from 'react'
import { useSetMediaState } from './useMediaState'
import { getSetting } from '@/core'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ShortCut } from '~/typings/setting'

const isShortCut = (e: KeyboardEvent, shortcut?: ShortCut | null) => {
  if (
    shortcut &&
    shortcut.key === e.key &&
    e.metaKey === shortcut.metaKey &&
    shortcut.altKey === e.altKey &&
    shortcut.shiftKey === e.shiftKey &&
    shortcut.ctrlKey === e.ctrlKey
  ) {
    return true
  }
  return false
}
const useMediaShortcut = (containerRef: RefObject<HTMLElement>) => {
  const setMediaState = useSetMediaState()
  const instance = useMediaInstance()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (!containerRef.current?.contains(e.target)) {
      return
    }
    if (
      e.target instanceof HTMLElement &&
      (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[contenteditable=true]'))
    )
      return
    if (isHotkey(KEY.Space, e)) {
      e.preventDefault()
      setMediaState(s => ({ ...s, paused: !s.paused }))
    }
    setTimeout(() => {
      if (e.defaultPrevented) return
      const setting = getSetting()
      const shortcut = setting.shortcut.makeVideoLabel
      if (isShortCut(e, shortcut)) {
        const time = instance.getVideoState?.().currentTime
        if (time) {
          instance.insertLabel?.({
            time
          })
        }
      }
      if (isHotkey(KEY.ArrowLeft, e)) {
        e.stopPropagation()
        setMediaState(s => ({
          ...s,
          jumpTime: Math.max((s.currentTime || 0) - 5, 0),
          jumpIndicator: 'back'
        }))
        e.preventDefault()
      }
      if (isHotkey(KEY.ArrowRight, e)) {
        e.stopPropagation()
        e.preventDefault()
        setMediaState(s => ({
          ...s,
          jumpTime: Math.min((s.currentTime || 0) + 5, s.totalTime || 0),
          jumpIndicator: 'forward'
        }))
      }
      if (isHotkey(KEY.ArrowDown, e)) {
        e.stopPropagation()
        e.preventDefault()
        setMediaState(s => ({
          ...s,
          volume: Math.max(0, s.volume - 0.05),
          volumeIndicator: 'down'
        }))
      }
      if (isHotkey(KEY.ArrowUp, e)) {
        e.preventDefault()
        e.stopPropagation()
        setMediaState(s => ({
          ...s,
          volume: Math.min(0.6, s.volume + 0.05),
          volumeIndicator: 'up'
        }))
      }
    })
  })
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  }, [containerRef])
}

export default useMediaShortcut
