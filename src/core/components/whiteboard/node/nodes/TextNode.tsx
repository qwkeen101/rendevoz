import { InnerNodeProps } from '../WrapperNode'
import { IEditorInstance, IWhiteboardNode } from '~/typings'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { useRef, memo } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
const TextNode = ({ node, onClick }: InnerNodeProps & { onClick: VoidFunction }) => {
  const textNode = node as IWhiteboardNode & { type: 'text' }
  const instance = useWhiteboardInstance()
  const i = useRef<IEditorInstance>()

  const handleChangeValue = (newValue: string) => {
    instance.updateNode?.(textNode.id, n => ({ ...n, content: newValue }), false)
  }

  const containerRef = useRef<HTMLElement>(null)

  return (
    <div
      style={{
        background: 'transparent',
        width: node.type === 'mindmap' || node.rootId ? undefined : '200px',
        minWidth: '100%',
        maxWidth: '100%',
        height: '100%',
        minHeight: '100%',
        maxHeight: '100%',
        padding: '3px 8px',
        pointerEvents: 'auto'
      }}
      ref={containerRef}
      onClick={onClick}
    >
      <SimpleEditor
        disableScrollIntoView
        textareaMode={true}
        placeholder={node.type === 'mindmap' || node.rootId ? '' : undefined}
        virtualizer={node.resized}
        onInstanceInitialized={ins => (i.current = ins)}
        value={textNode.content}
        containerStyle={{
          height: '100%'
        }}
        fontSize={node.type === 'mindmap' ? 30 : undefined}
        onChange={v => {
          handleChangeValue(v)
        }}
      />
    </div>
  )
}

export default memo(
  TextNode,
  (curr, prev) => curr.node === prev.node && prev.nodeState?.focused === curr.nodeState?.focused && prev.node.resized === curr.node.resized
)
