// cmd w 关闭当前标签
import { GlobalInstance, useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { setPanelState } from '@/components/layout/sidebar'
import produce from 'immer'

export default function useGlobalShortcutHandler() {
  const shortcutSettings = useSelectGlobalAtomValue(SettingAtom, s => s.shortcut)
  const isShortcut = (e: KeyboardEvent, shortcutKey: keyof typeof shortcutSettings) => {
    const shortcut = shortcutSettings[shortcutKey]
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
  const keydownHandler = (e: KeyboardEvent) => {
    if (isHotkey('mod+w', e) || isHotkey('mod+q', e) || isHotkey('mod+r', e)) {
      e.preventDefault()
    }
    if (isShortcut(e, 'openObjectPanel')) {
      GlobalInstance.metaOps?.toggleDetails()
    }
    if (isShortcut(e, 'openSidebar')) {
      setPanelState(draft => {
        draft.leftOpen = !draft.leftOpen
        draft.visible.size === 0 && draft.visible.add('database')
      })
    }
    if (isShortcut(e, 'openGlobalSearch')) {
      GlobalInstance.searchOps?.openSearchPanel()
    }
    if (isShortcut(e, 'switchToPrevTab')) {
      GlobalInstance.layoutOps?.switchToTab('prev')
    }
    if (isShortcut(e, 'switchToNextTab')) {
      GlobalInstance.layoutOps?.switchToTab('next')
    }
    if (isShortcut(e, 'closeCurrentTab')) {
      GlobalInstance.layoutOps?.closeCurrentFocusedTab()
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [shortcutSettings])
}
