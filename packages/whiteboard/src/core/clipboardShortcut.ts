import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useWhiteboardInstance, useWhiteboardSelection } from '../hooks'

const useClipboardShortcut = () => {
  const instance = useWhiteboardInstance()
  const selection = useWhiteboardSelection()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('textarea, input, [contenteditable]')) return
      if (!instance.isFocused?.()) return
      if (isHotkey('mod+c', e)) {
        instance.clipboardOps?.copy?.(selection)
        e.preventDefault()
      }
      if (isHotkey('mod+x', e)) {
        instance.clipboardOps?.cut?.(selection)
        e.preventDefault()
      }
      if (isHotkey('mod+v', e)) {
        instance.clipboardOps?.paste?.()
        e.preventDefault()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [instance, selection])
}

export default useClipboardShortcut
