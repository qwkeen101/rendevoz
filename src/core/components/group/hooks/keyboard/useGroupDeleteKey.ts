import { IGroupInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

const useGroupDeleteKey = (instance: IGroupInstance) => {
  const handleDeleteKey = (e: KeyboardEvent) => {
    console.log(e)
    if (e.target instanceof HTMLElement && !e.target.closest("input,textarea,[contenteditable='true']"))
      if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
        const selected = instance.values.selectedRowIdSet
        console.log(selected)
        if (selected.size) {
          instance.valueOps?.deleteItems(Array.from(selected.values()))
        }
      }
  }
  return handleDeleteKey
}

export default useGroupDeleteKey
