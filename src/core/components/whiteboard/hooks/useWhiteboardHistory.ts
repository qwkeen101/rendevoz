import { useStore } from 'jotai'
import { useEffect, useRef } from 'react'
import { useFlow, WhiteboardAtom } from '@/core/components/whiteboard/hooks'
import isHotkey from 'is-hotkey'
import { ObjectStore } from '@/api/stores'
import { IWhiteboard } from '~/typings'
import { applyPatches } from 'immer'
import { useMemoizedFn } from '@/hooks'

const useWhiteboardHistory = () => {
  const store = useStore()
  const flow = useFlow()
  const currentControlState = useRef<IWhiteboard>()

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
      redos.pop()
      undos.push(lastRedo)
    }
  }
  flow.redo = redo
  const undo = () => {
    const undos = flow.history.undos
    const redos = flow.history.redos
    if (undos.length) {
      console.log('handle undo')
      const lastUndo = undos[undos.length - 1]
      const currentWhiteboard = store.get(WhiteboardAtom)
      if (currentWhiteboard) {
        const newWhiteboard = applyPatches(currentWhiteboard, lastUndo.inversePatches)
        ObjectStore('whiteboard').updateOne(newWhiteboard)
        redos.push(lastUndo)
        undos.pop()
      }
    }
  }
  flow.undo = undo
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    if (!flow.focused) return
    const target = e.target
    console.log(target)
    if (
      target instanceof HTMLElement &&
      (target.closest('input') || target.closest('textarea') || target.closest('[contenteditable="true"]'))
    ) {
      return
    }
    if (isHotkey('mod+z', e)) {
      undo()
    }
    if (isHotkey('mod+y', e)) {
      redo()
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
