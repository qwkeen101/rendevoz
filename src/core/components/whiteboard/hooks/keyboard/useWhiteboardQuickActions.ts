import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks'
import { useEffect, useState } from 'react'
import isHotkey from 'is-hotkey'
import { WhiteboardDefaultKeyboardShortcut } from '@/core/components/whiteboard/hooks/keyboard/DefaultWhiteboardShortcuts'
import { GlobalInstance, useMemoizedFn } from '@/hooks'
import { useWhiteboardState } from '@/core/components/whiteboard/hooks/useWhiteboardState'
import { KEY } from '@/consts'
import handleKeyboardNavigation from '@/core/components/whiteboard/hooks/keyboard/handleKeyboardNavigation'
import { mousePos } from '@/hooks/utils/useMousePositionRef'
import handleKeyboardPaste from '@/core/components/whiteboard/hooks/keyboard/handleKeyboardPaste'
import { Rendevoz } from '@/core/rendevoz'

export default () => {
  const instance = useWhiteboardInstance()
  const includeShortcuts = (e: KeyboardEvent, keys: string[]) => {
    return keys.some(k => isHotkey(k, e))
  }
  const [whiteboardState, setWhiteboardState] = useWhiteboardState()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    handleKeyboardPaste(e, instance)
    if (isHotkey(KEY.Escape, e)) {
      instance.edgeOps?.endAction()
      if (whiteboardState.highlightedIds) {
        setWhiteboardState(s => ({ ...s, highlightedIds: undefined }))
      }
    }
    if (!instance.isFocused?.()) return
    if (instance.getOutestContainerNode?.() !== document.activeElement && document.activeElement !== document.body) return
    if (e.defaultPrevented) return
    handleKeyboardNavigation(e, instance)
    if (isHotkey('mod+p', e)) {
      instance.searchOps?.toggleSearchPanel()
    }
    // undo fit transform
    if (isHotkey('shift+e', e)) {
      instance.containerOps?.undoTransform()
    }
    // redo fit transform
    if (isHotkey('shift+q', e)) {
      instance.containerOps?.redoTransform()
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.MoveTo.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        const metas = selected.filter(i => i.type === 'metaObject').map(i => i.metaObjectId)
        if (metas.length) {
          GlobalInstance.metaOps?.quickAdd(metas)
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.Edit.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        const metas = selected.filter(i => i.type === 'metaObject').map(i => i.metaObjectId)
        if (metas.length === 1) {
          Rendevoz.Actions.Open.Meta.openEditMetaDialog(metas[0])
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.OpenInCenter.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length === 1) {
        if (instance.nodeOps?.canExpand(selected[0])) {
          instance.nodeOps?.open(selected[0].id, 'center')
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.OpenInNewTabs.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length === 1) {
        if (instance.nodeOps?.canExpand(selected[0])) {
          instance.nodeOps?.open(selected[0].id, 'newTab')
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.OpenInFloat.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length === 1) {
        if (instance.nodeOps?.canExpand(selected[0])) {
          instance.nodeOps?.open(selected[0].id, 'float')
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.OpenInSidebar.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length === 1) {
        if (instance.nodeOps?.canExpand(selected[0])) {
          instance.nodeOps?.open(selected[0].id, 'sidePeek')
          instance.toolbarOps?.closeToolbar()
        }
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.Expand.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        const canExpandOrFold = selected.some(i => instance.nodeOps?.canExpand(i))
        if (!canExpandOrFold) return
        const showExpandIcon = selected.some(i => instance.nodeOps?.canExpand(i) && !i.expanded)
        const selectedIds = selected.map(i => i.id)
        if (showExpandIcon) {
          instance.nodeOps?.expand(selectedIds)
        } else {
          instance.nodeOps?.fold(selectedIds)
        }
        setTimeout(() => {
          instance.selectOps?.resetSelectionBox()
        }, 100)
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.FitIntoView.key)) {
      instance.containerOps?.fitToSelected()
      instance.toolbarOps?.closeToolbar()
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.DrawLine.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length === 1) {
        instance.edgeOps?.startDrawEdge(selected[0].id)
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.Group.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length && selected.length > 1) {
        instance.groupOps?.groupNodes(selected.map(i => i.id))
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.Copy.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        instance.nodeOps?.copy(instance.nodeOps?.extendNodes(selected).map(i => i.id))
        instance.toolbarOps?.closeToolbar()
      }
    }

    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.Delete.key)) {
      const selected = instance.selectOps?.getSelectedNodes()

      if (selected?.length) {
        instance.nodeOps?.deleteNode(selected?.map(i => i.id))
        instance.selectOps?.deselectAll()
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.ViewDetails.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length && selected.length === 1) {
        const s = selected[0]
        if (s.type === 'metaObject') {
          GlobalInstance.metaOps?.openDetails(s.metaObjectId)
        }
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.HighlightRelated.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        instance.nodeOps?.highlightRelatedEdgesAndNodes(selected?.map(i => i.id))
        instance.toolbarOps?.closeToolbar()
      }
    }
    if (includeShortcuts(e, WhiteboardDefaultKeyboardShortcut.FitToContent.key)) {
      const selected = instance.selectOps?.getSelectedNodes()
      if (selected?.length) {
        instance.nodeOps?.fitContent(selected.map(i => i.id))
        instance.toolbarOps?.closeToolbar()
      }
    }
  })
  useEffect(() => {
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  }, [])
}
