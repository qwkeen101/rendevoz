import { useEffect } from 'react'
import { useSetAtom } from 'jotai'
import { GroupStateAtom } from '@/core/components/group/hooks/useGroupState'
import { useGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import isHotkey from 'is-hotkey'

export default () => {
  const setGroupState = useSetAtom(GroupStateAtom)
  const instance = useGroupInstance()
  useEffect(() => {
    const s = (e: KeyboardEvent) => {
      if (e.type === 'keydown') {
        if (instance.values.isFocused) {
          if (isHotkey('mod+a', e)) {
            if (e.target instanceof Element && e.target.closest('input,textarea,[contenteditable="true"]')) return
            instance.selectOps?.selectAll()
            e.preventDefault()
          }
        }
        if (e.shiftKey) {
          setGroupState(s => ({ ...s, shiftPressed: true }))
          document.addEventListener('keyup', s)
        }
      }
      if (e.type === 'keyup') {
        setGroupState(s => (s.shiftPressed ? { ...s, shiftPressed: false } : s))
        if (instance.values.selectedRowIdSet.size === 0) {
          instance.values.lastSelectRowId = undefined
        }
        document.removeEventListener('keyup', s)
      }
    }
    document.addEventListener('keydown', s)
    return () => {
      document.removeEventListener('keydown', s)
    }
  }, [])
}
