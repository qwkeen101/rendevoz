import { IWhiteboardInstance } from '../../types'
import { Patch, applyPatches } from 'immer'
import { WhiteboardAtom, WhiteboardStateAtom, normalizeWhiteboard } from '../store'
import { IWhiteboard } from '../../types/whiteboard'
import { Store } from 'jotai/vanilla'

export const assignHistoryOps = (
  instance: IWhiteboardInstance,
  store: Store,
  onChange?: (value: IWhiteboard) => void
) => {
  const undoStack: { patches: Patch[]; inversePatches: Patch[] }[] = []
  const redoStack: { patches: Patch[]; inversePatches: Patch[] }[] = []
  const syncHistoryState = () => {
    store.set(WhiteboardStateAtom, state => ({
      ...state,
      history: {
        undoSteps: undoStack.length,
        redoSteps: redoStack.length
      }
    }))
  }

  instance.historyOps = {
    pushUpdates: ({ patches, inversePatches }) => {
      undoStack.push({ patches, inversePatches })
      redoStack.length = 0
      syncHistoryState()
    },
    _pushInternal: ({ patches, inversePatches }) => {
      undoStack.push({ patches, inversePatches })
      redoStack.length = 0
      syncHistoryState()
    },
    undo: () => {
      const record = undoStack.pop()
      if (!record) return
      const current = store.get(WhiteboardAtom)
      const patched = normalizeWhiteboard(applyPatches(current, record.inversePatches))
      store.set(WhiteboardAtom, patched)
      redoStack.push(record)
      onChange?.(patched)
      syncHistoryState()
    },
    redo: () => {
      const record = redoStack.pop()
      if (!record) return
      const current = store.get(WhiteboardAtom)
      const patched = normalizeWhiteboard(applyPatches(current, record.patches))
      store.set(WhiteboardAtom, patched)
      undoStack.push(record)
      onChange?.(patched)
      syncHistoryState()
    },
    canUndo: () => undoStack.length > 0,
    canRedo: () => redoStack.length > 0
  }
}
