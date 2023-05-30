import { IShortCutSetting, useSetting } from '@/core'
import { useEffect } from 'react'
import { useMemoizedFn } from '../utils'

export const useShortcut = (shortcutName: keyof IShortCutSetting['shortcut'], onTrigger: VoidFunction) => {
  const [setting] = useSetting()
  const shortcut = setting.shortcut[shortcutName]
  const shortcutHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (shortcut) {
      if (
        e.key === shortcut.key &&
        e.shiftKey === shortcut.shiftKey &&
        e.ctrlKey === shortcut.ctrlKey &&
        e.altKey === shortcut.altKey &&
        e.metaKey === shortcut.metaKey
      )
        onTrigger()
    }
  })
  useEffect(() => {
    document.addEventListener('keydown', shortcutHandler)
    return () => {
      document.removeEventListener('keydown', shortcutHandler)
    }
  }, [])
}
