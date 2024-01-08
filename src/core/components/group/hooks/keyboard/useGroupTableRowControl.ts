import { IGroupInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export default (instance: IGroupInstance) => {
  return (e: KeyboardEvent) => {
    const currSelectOneRow = instance.values.selectedRowIdSet.size === 1
    const currSelectCell = instance.viewOps?.tableOps?.getCurrentSelectedCell()
    // navigate on cell
    if (currSelectCell) return
    if (!currSelectOneRow) return
    if (document.querySelector('[role="popup-wrapper"]')) return
    if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]')) return
    if (isHotkey(KEY.ArrowUp, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      const currVisible = instance.valueOps?.getVisibleValues()
      if (currVisible) {
        const currIdx = currVisible.findIndex(i => i[0].rowId === currentRowId)
        if (currIdx >= 1) {
          const nextRow = currVisible[currIdx - 1][0].rowId
          instance.selectOps?.selectItem(nextRow, true)
        }
      }
    }
    if (isHotkey(KEY.ArrowDown, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      const currVisible = instance.valueOps?.getVisibleValues()
      if (currVisible) {
        const currIdx = currVisible.findIndex(i => i[0].rowId === currentRowId)
        if (currIdx < currVisible.length - 1 && currIdx >= 0) {
          const nextRow = currVisible[currIdx + 1][0].rowId
          instance.selectOps?.selectItem(nextRow, true)
        }
      }
    }
    if (isHotkey(KEY.Enter, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      instance.selectOps?.clearAllSelect()
      instance.viewOps?.tableOps?.selectCell(currentRowId, 0)
    }
    if(isHotkey(KEY.Escape,e)){
      e.preventDefault()
      instance.selectOps?.clearAllSelect()
    }
  }
}
