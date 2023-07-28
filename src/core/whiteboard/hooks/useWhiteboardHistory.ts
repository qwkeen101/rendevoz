import { useAtomValue, useStore } from 'jotai'
import { useEffect, useRef } from 'react'
import { useFlow, WhiteboardAtom } from '@/core/whiteboard/hooks'
import { useDebounceEffect } from '@/hooks'
import isHotkey from 'is-hotkey'
import { ObjectStore } from '@/stores'
import { IWhiteboard } from '~/typings'

const useWhiteboardHistory = () => {
  const store = useStore()
  const historyRef = useRef({
    redos: [],
    undos: []
  })
  const flow = useFlow()
  const whiteboardState = useAtomValue(WhiteboardAtom)
  const previousState = useRef<IWhiteboard>()
  const currentControlState = useRef<IWhiteboard>()
  useDebounceEffect(
    () => {
      const previous = previousState.current
      previousState.current = whiteboardState
      const currentControl = currentControlState.current
      const { undos, redos } = historyRef.current
      if (previous) {
        // new state is manipulated by redo or undo, don't add to undo
        const alreadyHave =
          currentControl &&
          (undos.some(i => i.nodes === currentControl?.nodes && i.edges === currentControl?.edges) ||
            redos.some(i => i.nodes === currentControl?.nodes && i.edges === currentControl?.edges))
        console.log(alreadyHave)
        if (alreadyHave){
          currentControlState.current = undefined
          return
        }
        currentControlState.current = undefined
        undos.push(previous)
        historyRef.current.redos = []
        // not more than 50
        while (undos.length > 50) {
          undos.shift()
        }
      }
    },
    [whiteboardState],
    { wait: 200 }
  )
  const redo = () => {
    const undos = historyRef.current.undos
    const redos = historyRef.current.redos
    if (redos.length) {
      const state = redos[redos.length - 1]
      console.log('handle redo', state)
      const currentWhiteboard = store.get(WhiteboardAtom)
      ObjectStore('whiteboard').updateOne(state, { silent: true })
      currentControlState.current = currentWhiteboard
      redos.pop()
      undos.push(currentWhiteboard)
    }
  }
  const undo = () => {
    const undos = historyRef.current.undos
    const redos = historyRef.current.redos
    if (undos.length) {
      console.log('handle undo')
      const state = undos[undos.length - 1]
      const currentWhiteboard = store.get(WhiteboardAtom)
      if (currentWhiteboard) {
        ObjectStore('whiteboard').updateOne(state, { silent: true })
        redos.push(currentWhiteboard)
        currentControlState.current = currentWhiteboard
        undos.pop()
      }
    }
  }
  useEffect(() => {
    const parentEle = flow.parentContainerEle
    if (parentEle) {
      const keydownHandler = (e: KeyboardEvent) => {
        if (isHotkey('mod+z', e)) {
          undo()
        }
        if (isHotkey('mod+y', e)) {
          redo()
        }
      }
      document.addEventListener('keydown', keydownHandler)
      return () => {
        document.removeEventListener('keydown', keydownHandler)
      }
    }
  })
}

export default useWhiteboardHistory
