import { memo } from 'react'
import { useWhiteboardInstance, useWhiteboardState } from '../hooks'

const Toolbar = memo(() => {
  const instance = useWhiteboardInstance()
  const state = useWhiteboardState()
  const canUndo = typeof state.history?.undoSteps === 'number' ? state.history.undoSteps > 0 : instance.historyOps?.canUndo?.()
  const canRedo = typeof state.history?.redoSteps === 'number' ? state.history.redoSteps > 0 : instance.historyOps?.canRedo?.()
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 12,
        padding: '6px 8px',
        background: 'rgba(255,255,255,0.92)',
        border: '1px solid #e2e8f0',
        borderRadius: 10,
        boxShadow: '0 10px 30px rgba(15, 23, 42, 0.08)',
        display: 'flex',
        gap: 8,
        alignItems: 'center',
        zIndex: 10
      }}
    >
      <button
        onClick={() => instance.historyOps?.undo?.()}
        disabled={!canUndo}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: canUndo ? '#fff' : '#f1f5f9',
          cursor: canUndo ? 'pointer' : 'not-allowed'
        }}
      >
        Undo
      </button>
      <button
        onClick={() => instance.historyOps?.redo?.()}
        disabled={!canRedo}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #cbd5e1',
          background: canRedo ? '#fff' : '#f1f5f9',
          cursor: canRedo ? 'pointer' : 'not-allowed'
        }}
      >
        Redo
      </button>
      <span style={{ fontSize: 12, color: '#475569' }}>{state.readOnly ? 'Read only' : 'Editable'}</span>
    </div>
  )
})

export default Toolbar
