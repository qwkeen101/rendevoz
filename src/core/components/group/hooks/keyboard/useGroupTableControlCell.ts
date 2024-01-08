import { IGroupInstance } from '~/typings'
import isHotkey from 'is-hotkey'
import { KEY } from '@/consts'

export default (instance: IGroupInstance) => {
  return (e: KeyboardEvent) => {
    const currSelectCell = instance.viewOps?.tableOps?.getCurrentSelectedCell()
    if (!currSelectCell) return
    if (document.querySelector('[role="popup-wrapper"]')) return
    if (e.target instanceof HTMLElement && e.target.closest('input,textarea,[contenteditable="true"]')) return
    if (isHotkey(KEY.ArrowLeft, e)) {
      e.preventDefault()
      instance.viewOps?.tableOps?.navigateCell('left')
    }
    if (isHotkey(KEY.ArrowRight, e)) {
      e.preventDefault()
      instance.viewOps?.tableOps?.navigateCell('right')
    }
    if (isHotkey(KEY.ArrowUp, e)) {
      e.preventDefault()
      instance.viewOps?.tableOps?.navigateCell('up')
    }
    if (isHotkey(KEY.ArrowDown, e)) {
      e.preventDefault()
      instance.viewOps?.tableOps?.navigateCell('down')
    }
    if (isHotkey(KEY.Enter, e)) {
      e.preventDefault()
      instance.getOuterContainer?.().querySelector(`[data-cell="${currSelectCell.rowId}-${currSelectCell.index}"]`)?.click?.()
    }
    if (isHotkey(KEY.Escape, e)) {
      e.preventDefault()
      instance.viewOps?.tableOps?.deselectCell()
      instance.selectOps?.selectItem(currSelectCell.rowId)
    }
  }
}
