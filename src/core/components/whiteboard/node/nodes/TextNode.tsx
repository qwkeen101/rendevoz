import { InnerNodeProps } from '../WrapperNode'
import { IEditorInstance, IWhiteboardNode } from '~/typings'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { useRef, memo, useEffect } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { Editor, Transforms } from 'slate'
import { ReactEditor } from '@/core'

const TextNode = ({ node, onClick, nodeState }: InnerNodeProps & { onClick: VoidFunction }) => {
  const textNode = node as IWhiteboardNode & { type: 'text' }
  const instance = useWhiteboardInstance()
  const i = useRef<IEditorInstance>()
  useEffect(() => {
    if (nodeState?.focused) {
      const editorI = i.current
      if (editorI) {
        const editor = editorI.getSlateEditor?.()
        if (editor) {
          if (!editor.selection) {
            Transforms.select(editor, Editor.start(editor, [0]))
          }
          ReactEditor.focus(editor)
        }
      }
    }
  }, [nodeState?.focused])
  const firstChanged = useRef(false)
  const handleChangeValue = (newValue: string) => {
    instance.updateNode?.(textNode.id, n => ({ ...n, content: newValue }), false)
  }

  const handleChangeSize = (newSize: (IWhiteboardNode & { type: 'text' })['fontSize']) => {
    instance.updateNode?.(textNode.id, n => ({ ...n, fontSize: newSize }))
  }
  const containerRef = useRef<HTMLElement>(null)

  const getFontsize = () => {
    switch (textNode.fontSize) {
      case 'small':
        return '0.9rem'
      case 'middle':
        return '1rem'
      case 'super large':
        return '1.8rem'
      case 'large':
        return '1.3rem'
      default:
        return '1rem'
    }
  }
  return (
    <div
      style={{
        background: 'transparent',
        width: '200px',
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100%',
        maxHeight: '100%',
        padding: '0px 0px 0px 4px',
        pointerEvents: 'auto',
        fontSize: getFontsize()
      }}
      ref={containerRef}
      onClick={onClick}
    >
      <SimpleEditor
        onInstanceInitialized={ins => (i.current = ins)}
        value={textNode.content}
        onChange={v => {
          if (firstChanged.current) {
            handleChangeValue(v)
            return
          }
          firstChanged.current = true
        }}
      />
    </div>
  )
}

export default memo(
  TextNode,
  (curr, prev) => curr.node.content === prev.node.content && prev.nodeState?.focused === curr.nodeState?.focused
)
