import { IShortCutSetting, useSetting } from '@/core'
import { useEffect } from 'react'
import { useMemoizedFn } from '../utils'
import { compareHotkey } from 'is-hotkey'

export const useShortcut = (shortcutName: keyof IShortCutSetting['shortcut'], onTrigger: VoidFunction) => {
  const [setting] = useSetting()
  const shortcutHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (compareHotkey(setting.shortcut[shortcutName], e)) {
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
