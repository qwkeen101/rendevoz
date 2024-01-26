import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

// cancel edit state
export default (instance: InnerGroupInstance) => {
  return (e: KeyboardEvent) => {
    if (isHotkey(KEY.Escape, e)) {
      instance.values.inViewRowFuncs.forEach(i => {
        i.unedit?.()
      })
    }
  }
}
