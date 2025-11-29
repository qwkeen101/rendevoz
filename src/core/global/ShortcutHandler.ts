// cmd w 关闭当前标签
import { useSelectGlobalAtomValue } from '@/hooks'
import { SettingAtom } from '@/core'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import updateSidebarState from '@/components/layout/sidebar/updateSidebarState'

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
    if (isShortcut(e, 'quickCreateObject')) {
      e.preventDefault()
      Global.metaOps?.createObjects(undefined, undefined, { openAfterTriggerOnce: true })
    }
    if (isShortcut(e, 'openObjectPanel')) {
      e.preventDefault()
      Global.metaOps?.toggleDetails()
    }
    if (isShortcut(e, 'closeOtherTabs')) {
      e.preventDefault()
      Global.layoutOps?.closeTabs('others')
    }
    if (isShortcut(e, 'closeRightTabs')) {
      e.preventDefault()
      Global.layoutOps?.closeTabs('right')
    }
    if (isShortcut(e, 'closeLeftTabs')) {
      e.preventDefault()
      Global.layoutOps?.closeTabs('left')
    }
    if (isShortcut(e, 'openSidebar')) {
      e.preventDefault()
      updateSidebarState(draft => {
        draft.leftOpen = !draft.leftOpen
        draft.leftVisible = draft.leftVisible || 'application'
      })
    }
    if (isShortcut(e, 'openGlobalSearch')) {
      e.preventDefault()
      Global.searchOps?.openSearchPanel()
    }
    if (isShortcut(e, 'switchToPrevTab')) {
      e.preventDefault()
      Global.layoutOps?.switchToTab('prev')
    }
    if (isShortcut(e, 'switchToNextTab')) {
      e.preventDefault()
      Global.layoutOps?.switchToTab('next')
    }
    if (isShortcut(e, 'closeCurrentTab')) {
      e.preventDefault()
      Global.layoutOps?.closeCurrentFocusedTab()
    }
  }
  useEffect(() => {
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [shortcutSettings])
}
