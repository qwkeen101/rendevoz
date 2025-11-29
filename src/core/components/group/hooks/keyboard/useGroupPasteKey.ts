import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import { InnerGroupInstance } from '@/core/components/group/hooks/useGroupInstance'
import { handleFilterAdd } from '@/core/components/group/hooks/ops/useAssignMetaOps'

export default (instance: InnerGroupInstance) => {
  const handlePasteKey = async (e: KeyboardEvent) => {
    if (e.target instanceof HTMLElement && !e.target.closest("input,textarea,[contenteditable='true']"))
      if (isHotkey(KEY.Paste, e)) {
        const pos = {
          x: mousePos.current[0],
          y: mousePos.current[1]
        }
        const ele = document.elementFromPoint(pos.x, pos.y)
        if (ele && instance.getOuterContainer?.()?.contains(ele) && !ele.closest('[role="group-side-peek"]')) {
          const copied = await Global.metaOps?.getCopiedMetaObjects()
          if (copied?.length) {
            const groupState = instance.getGroupState?.()
            if (!groupState) return
            const addAfterCreate = groupState.state?.addAfterCreateMeta
            copied.forEach(m => {
              handleFilterAdd(groupState, m)
            })
            if (addAfterCreate !== false) {
              const isFirst = groupState.data?.autoAddto === 'first'
              instance.valueOps?.insertValueByPath(
                copied.map(i => ({
                  type: 'metaObject',
                  id: i.id
                })),
                isFirst ? [0] : undefined
              )
            }
          }
        }
      }
  }
  return handlePasteKey
}
