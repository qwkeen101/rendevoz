import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { useWhiteboardInstance, useWhiteboardSelection } from '../hooks'

const useKeyboardShortcuts = () => {
  const instance = useWhiteboardInstance()
  const selection = useWhiteboardSelection()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && e.target.closest('textarea, input, [contenteditable]')) return
      if (!instance.isFocused?.()) return
      if (isHotkey('backspace', e) || isHotkey('delete', e)) {
        const nodes = Array.from(selection.nodes)
        if (nodes.length) {
          instance.nodeOps?.deleteNodes?.(nodes)
          e.preventDefault()
        }
      }
      if (isHotkey('cmd+a', e) || isHotkey('ctrl+a', e)) {
        const nodes = instance.getAllNode?.() || []
        instance.selectOps?.setSelection?.({
          nodes: new Set(nodes.map(n => n.id)),
          edges: new Set()
        })
        e.preventDefault()
      }
      if (isHotkey('escape', e)) {
        instance.selectOps?.clear?.()
        e.preventDefault()
      }
      const alignHotkeys: Record<string, 'left' | 'right' | 'top' | 'bottom' | 'horizontallyCenter' | 'verticallyCenter'> = {
        'mod+shift+l': 'left',
        'mod+shift+r': 'right',
        'mod+shift+t': 'top',
        'mod+shift+b': 'bottom',
        'mod+shift+h': 'horizontallyCenter',
        'mod+shift+v': 'verticallyCenter'
      }
      const matched = Object.keys(alignHotkeys).find(key => isHotkey(key, e))
      if (matched) {
        const nodes = Array.from(selection.nodes)
          .map(id => instance.getNode?.(id))
          .filter(Boolean) as any
        if (nodes.length) {
          instance.layoutOps?.align?.(alignHotkeys[matched], nodes)
          e.preventDefault()
        }
      }
      if (isHotkey('mod+shift+p', e)) {
        const nodes = Array.from(selection.nodes)
          .map(id => instance.getNode?.(id))
          .filter(Boolean) as any
        instance.layoutOps?.packNodes?.(nodes.length ? nodes : undefined)
        e.preventDefault()
      }
      const distributeHotkeys: Record<string, 'horizontal' | 'vertical'> = {
        'mod+shift+,': 'horizontal',
        'mod+shift+.': 'vertical'
      }
      const distribute = Object.keys(distributeHotkeys).find(key => isHotkey(key, e))
      if (distribute) {
        const nodes = Array.from(selection.nodes)
          .map(id => instance.getNode?.(id))
          .filter(Boolean) as any
        if (nodes.length) {
          instance.layoutOps?.distributeSpacing?.(distributeHotkeys[distribute], nodes)
          e.preventDefault()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [instance, selection.nodes])
}

export default useKeyboardShortcuts
