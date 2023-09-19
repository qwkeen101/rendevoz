import { IGroupInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { Path } from 'slate'

const useGroupDeleteKey = (instance: IGroupInstance) => {
  const handleDeleteKey = (e: KeyboardEvent) => {
    if (e.target === instance.getOuterContainer?.())
      if (isHotkey(KEY.Delete, e) || isHotkey(KEY.Backspace, e)) {
        const selected = instance.values.selectedRowIdSet
        if (selected.size) {
          const allPaths = Array.from(selected.values())
            .map(i => instance.pathOps?.getPathById(i))
            .filter(i => i) as Path[]
          allPaths.forEach(p => instance.valueOps?.removeByPath(p))
          instance.values.selectedRowIdSet.clear()
        }
      }
  }
  return handleDeleteKey
}

export default useGroupDeleteKey
