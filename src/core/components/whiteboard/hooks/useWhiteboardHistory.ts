import { useStore } from 'jotai'
import { useEffect, useRef } from 'react'
import { useFlow, WhiteboardAtom } from '@/core/components/whiteboard/StateHooks'
import isHotkey from 'is-hotkey'
import { ObjectStore } from '@/api/stores'
import { IWhiteboard } from '~/typings'
import { applyPatches } from 'immer'
import { useMemoizedFn } from '@/hooks'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'

const useWhiteboardHistory = () => {
  const store = useStore()
  const flow = useFlow()
  const currentControlState = useRef<IWhiteboard>()
  const instance = useWhiteboardInstance()
  const redo = () => {
    const undos = flow.history.undos
    const redos = flow.history.redos
    if (redos.length) {
      const lastRedo = redos[redos.length - 1]
      const currentWhiteboard = store.get(WhiteboardAtom)
      if (!currentWhiteboard) return
      const newWhiteboard = applyPatches(currentWhiteboard, lastRedo.patches)
      ObjectStore('whiteboard').updateOne(newWhiteboard, { silent: true })
      currentControlState.current = currentWhiteboard
      setTimeout(() => {
        if (instance.selectOps?.getSelectedNodes().length) {
          instance.selectOps?.resetSelectionBox()
        }
      })
      redos.pop()
      undos.push(lastRedo)
      instance.getOutestContainerNode?.().focus()
    }
  }
  flow.redo = redo
  const undo = () => {
    const undos = flow.history.undos
    const redos = flow.history.redos
    if (undos.length) {
      const lastUndo = undos[undos.length - 1]
      const currentWhiteboard = store.get(WhiteboardAtom)
      if (currentWhiteboard) {
        const newWhiteboard = applyPatches(currentWhiteboard, lastUndo.inversePatches)
        ObjectStore('whiteboard').updateOne(newWhiteboard)
        setTimeout(() => {
          if (instance.selectOps?.getSelectedNodes().length) {
            instance.selectOps?.resetSelectionBox()
          }
        })
        redos.push(lastUndo)
        undos.pop()
        instance.getOutestContainerNode?.().focus()
      }
    }
  }
  flow.undo = undo
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (!flow.focused) return
    if (instance.getOutestContainerNode?.() !== document.activeElement && document.activeElement !== document.body) return
    if (e.defaultPrevented) return
    if (isHotkey('mod+z', e)) {
      undo()
      e.preventDefault()
    }
    if (isHotkey('mod+y', e)) {
      redo()
      e.preventDefault()
    }
  })

  useEffect(() => {
    document.addEventListener('keydown', keydownHandler)
    return () => {
      document.removeEventListener('keydown', keydownHandler)
    }
  })
}

export default useWhiteboardHistory
