import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useWhiteboardInstance } from '../hooks'

const useHistoryShortcut = () => {
  const instance = useWhiteboardInstance()
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('textarea, input, [contenteditable]')) return
      if (!instance.isFocused?.()) return
      if (isHotkey('mod+z', e)) {
        instance.historyOps?.undo?.()
        e.preventDefault()
      }
      if (isHotkey('mod+y', e) || isHotkey('mod+shift+z', e)) {
        instance.historyOps?.redo?.()
        e.preventDefault()
      }
    }
    document.addEventListener('keydown', handler)
    return () => {
      document.removeEventListener('keydown', handler)
    }
  }, [instance])
}

export default useHistoryShortcut
