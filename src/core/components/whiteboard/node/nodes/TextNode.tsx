import { InnerNodeProps } from '../WrapperNode'
import { IEditorInstance, IWhiteboardNode } from '~/typings'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { useRef, memo, useMemo, useLayoutEffect } from 'react'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'
import { Descendant, Node } from 'slate'
import { ReactEditor } from '@/core'
const fontSizeToNumber: Record<(IWhiteboardNode & { type: 'text' })['fontSize'], number> = {
  small: 14,
  middle: 16,
  large: 20,
  'super large': 24
}
const TextNode = ({ node, onClick }: InnerNodeProps & { onClick: VoidFunction }) => {
  const textNode = node as IWhiteboardNode & { type: 'text' }
  const instance = useWhiteboardInstance()
  const i = useRef<IEditorInstance>()
  useLayoutEffect(() => {
    const currC = i.current?.getSlateEditor?.().children
    if (currC && currC !== textNode.content) {
      i.current?.replaceChildren?.(textNode.content)
    }
  }, [textNode.content])
  const handleChangeValue = (newValue: Descendant[]) => {
    if (newValue !== textNode.content) {
      instance.updateNode?.(textNode.id, n => ({ ...n, content: newValue }), false)
    }
  }
  const initialOkay = useMemo(() => Node.isNodeList(textNode.content), [])
  if (!initialOkay) {
    instance.deleteNode?.(node.id!)
    return null
  }
  return (
    <SimpleEditor
      disableScrollIntoView
      textareaMode={true}
      placeholder={node.type === 'mindmap' || node.rootId ? '' : undefined}
      virtualizer={node.resized}
      onInstanceInitialized={ins => {
        i.current = ins
        const funcs = instance.nodeOps?.getNodeFuncs?.(node.id!)
        if (funcs) {
          funcs.focusText = () => {
            const e = ins.getSlateEditor?.()
            console.log('focusing')
            e && ReactEditor.focus(e)
          }
        }
      }}
      value={textNode.content}
      onClick={onClick}
      containerStyle={{
        height: '100%',
        background: 'transparent',
        width: node.type === 'mindmap' || node.rootId ? undefined : '200px',
        minWidth: '100%',
        maxWidth: '100%',
        minHeight: '100%',
        maxHeight: '100%',
        padding: '3px 8px',
        pointerEvents: 'auto'
      }}
      fontSize={node.type === 'mindmap' ? 30 : textNode.fontSize ? fontSizeToNumber[textNode.fontSize] : undefined}
      onChange={v => {
        handleChangeValue(v)
      }}
    />
  )
}

export default memo(
  TextNode,
  (curr, prev) => curr.node === prev.node && prev.nodeState?.focused === curr.nodeState?.focused && prev.node.resized === curr.node.resized
)
