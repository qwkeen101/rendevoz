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
    if (isHotkey(KEY.ArrowUp, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      const prevMeta = instance.valueOps?.getPrevMeta(currentRowId, { loop: false, canPreview: false })
      if (prevMeta) {
        instance.selectOps?.selectItem(prevMeta.rowId, true)
        instance.values.inViewRowFuncs.get(prevMeta.rowId)?.scrollIntoView()
      }
    }
    if (isHotkey(KEY.ArrowDown, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      const nextMeta = instance.valueOps?.getNextMeta(currentRowId, { loop: false, canPreview: false })
      if (nextMeta) {
        instance.selectOps?.selectItem(nextMeta.rowId, true)
        instance.values.inViewRowFuncs.get(nextMeta.rowId)?.scrollIntoView()
      }
    }
    if (isHotkey(KEY.Enter, e)) {
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number
      e.preventDefault()
      instance.selectOps?.clearAllSelect()
      instance.viewOps?.tableOps?.selectCell(currentRowId, 0)
      instance.viewOps?.galleryOps?.editItem(currentRowId)
    }
    if (isHotkey(KEY.Escape, e)) {
      e.preventDefault()
      const currentRowId = instance.values.selectedRowIdSet.keys().next().value as number | undefined
      if (currentRowId) {
        instance.viewOps?.galleryOps?.uneditItem(currentRowId)
      }
      instance.selectOps?.clearAllSelect()
    }
  }
}
