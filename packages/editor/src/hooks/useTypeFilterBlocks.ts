import { useAtom } from 'jotai'
import { EditorOverlayStateAtom } from '../components/overlay/useEditorOverlay'
import { useEffect, useRef } from 'react'
import useEditorInstance from '../hooks/useEditorInstance'
import { Editor, Range } from 'slate'
import { useMemoizedFn } from '@/hooks'

// 键入搜索添加�?
export default () => {
  const [overlayState, setOverlayState] = useAtom(EditorOverlayStateAtom)
  const instance = useEditorInstance()
  const searchValueRef = useRef<{
    index: number
    value: string
  }>()
  const keydownHandler = useMemoizedFn((e: KeyboardEvent) => {
    setTimeout(() => {
      if (!searchValueRef.current) return
      const editor = instance.getSlateEditor?.()
      if (editor && editor.selection && Range.isCollapsed(editor.selection)) {
        const node = Editor.node(editor, editor.selection)
        const prevString = Editor.string(editor, {
          anchor: {
            offset: 0,
            path: node[1]
          },
          focus: editor.selection.focus
        })

        if (prevString.length < searchValueRef.current.index) {
          console.log(prevString.length, searchValueRef.current?.index)
          instance.overlayOps?.close()
          return
        }
        const searchValue = prevString.slice(searchValueRef.current.index)
        setOverlayState(s => ({ ...s, currentFilterValue: searchValue }))
      }
    })
  })

  useEffect(() => {
    if (overlayState.visible && (overlayState.content === 'slashMenu' || overlayState.content === 'blockHandleMenu')) {
      const editor = instance.getSlateEditor?.()
      if (editor && editor.selection && Range.isCollapsed(editor.selection)) {
        const node = Editor.node(editor, editor.selection)
        const prevString = Editor.string(editor, {
          anchor: {
            offset: 0,
            path: node[1]
          },
          focus: editor.selection.focus
        })
        searchValueRef.current = {
          index: prevString.length,
          value: ''
        }
      }
      document.addEventListener('keyup', keydownHandler, true)
      return () => {
        document.removeEventListener('keyup', keydownHandler, true)
      }
    }
  }, [overlayState.visible, overlayState.content])
}
