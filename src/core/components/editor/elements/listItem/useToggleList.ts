import { CustomElement } from '~/typings'
import { RefObject, useEffect, useRef, useState } from 'react'
import { Rendevoz } from '@/core/rendevoz'
import useEditorInstance from '@/core/components/editor/hooks/useEditorInstance'
import { useDebounceFn } from '@/hooks'
import { ReactEditor } from '@/core'

const useToggleList = (element: CustomElement) => {
  const emitter = Rendevoz.Events.Emit.useScopedEventEmitter()
  const containerRef = useRef<HTMLElement>(null)
  const handler = Rendevoz.Events.Emit.useEventHandler('editor')
  const instance = useEditorInstance()
  const [toggleState, setToggleState] = useState({
    canToggle: false,
    showToggle: false,
    hidenNodesLength: 0
  })
  const checkToggle = () => {
    const editor = instance.getSlateEditor?.()
    if (editor) {
      const path = ReactEditor.findPath(editor, element)
      if (path) {
        if (instance.toggleOps?.haveToggledChildren(path)) {
          const hidenNodes = element.folded ? instance.toggleOps?.getUnderNodes(path).length : 0

          setToggleState(s => ({ ...s, canToggle: true, hidenNodesLength: hidenNodes }))

          return
        }
      }
    }
    if (toggleState.canToggle) {
      setToggleState(s => ({ ...s, canToggle: false }))
    }
  }
  const debounceCheckToggle = useDebounceFn(checkToggle, { wait: 500 })

  handler.on('valueChange', () => debounceCheckToggle.run())
  useEffect(() => {
    checkToggle()
  }, [])
  const toggle = () => {
    const editor = instance.getSlateEditor?.()
    if (editor) {
      const path = ReactEditor.findPath(editor, element)
      if (path) {
        if (element.folded) {
          instance.toggleOps?.untoggleBlock(path)
        } else {
          instance.toggleOps?.toggleBlock(path)
        }
      }
    }
  }
  useEffect(() => {
    const container = containerRef.current
    if (container) {
      const pointerHandler = (e: PointerEvent) => {
        if (e.type === 'pointerenter') {
          if (toggleState.canToggle) {
            setToggleState(s => ({ ...s, showToggle: true }))
          }
        }
        if (e.type === 'pointerleave') {
          if (toggleState.showToggle) {
            setToggleState(s => ({ ...s, showToggle: false }))
          }
        }
      }
      container.addEventListener('pointerenter', pointerHandler)
      container.addEventListener('pointerleave', pointerHandler)
      emitter.addListener('editor', handler)
      return () => {
        emitter.removeListener('editor', handler)
        container.removeEventListener('pointerenter', pointerHandler)
        container.removeEventListener('pointerleave', pointerHandler)
      }
    }
  })
  return {
    hidenNodesLength: toggleState.hidenNodesLength,
    showToggle: toggleState.showToggle,
    canToggle: toggleState.canToggle,
    containerRef,
    toggle
  }
}

export default useToggleList
