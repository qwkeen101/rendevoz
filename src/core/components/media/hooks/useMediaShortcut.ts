import { KEY } from '@/consts'
import { useMemoizedFn } from '@/hooks'
import isHotkey, { compareHotkey } from 'is-hotkey'
import { RefObject, useEffect } from 'react'
import useMediaState from './useMediaState'
import { getSetting } from '@/core'
import { useMediaInstance } from '@/core/components/media/hooks/useMediaInstance'
import { ShortCut } from '~/typings/setting'
import useMediaSidebarState from '@/core/components/media/hooks/useMediaSidebarState'

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
  const [mediaState, setMediaState] = useMediaState()
  const [sidebarState, setSidebarState] = useMediaSidebarState()
  const instance = useMediaInstance()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (!containerRef.current?.contains(e.target)) {
      return
    }
    setTimeout(() => {
      if (e.defaultPrevented) return
      const setting = getSetting()
      const shortcut = setting.shortcut.makeVideoLabel
      const timestampShortcut = setting.shortcut.copyVideoTimestamp
      const openSidebarShortcut = setting.shortcut.openMediaSidebar
      if (e.target instanceof Element && e.target.closest('input,textarea')) {
        return
      }
      if (isShortCut(e, timestampShortcut)) {
        if (mediaState.currentTime) {
          instance.on?.({
            type: 'copyTimestamp',
            currentTime: mediaState.currentTime
          })
        }
      }
      if (isShortCut(e, shortcut)) {
        const time = instance.getVideoState?.().currentTime
        if (time) {
          instance.insertLabel?.({
            time
          })
        }
      }
      if (isShortCut(e, openSidebarShortcut)) {
        setSidebarState(s => ({ ...s, rightBarVisible: !s.rightBarVisible }))
      }
      if (isHotkey(KEY.Space, e)) {
        if (
          !(
            e.target instanceof HTMLElement &&
            (e.target.closest('input') || e.target.closest('textarea') || e.target.closest('[contenteditable=true]'))
          )
        ) {
          e.preventDefault()
          setMediaState(s => ({ ...s, paused: !s.paused }))
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
