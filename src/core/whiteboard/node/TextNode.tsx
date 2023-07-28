import { InnerNodeProps } from './WrapperNode'
import { useSetWhiteboardNodes } from '@/core/whiteboard/hooks'
import TextareaAutosize from '@/components/custom/input/autosizeTextarea'
import { IWhiteboardNode } from '~/typings'
import produce from 'immer'

const TextNode = ({ node }: InnerNodeProps) => {
  const textNode = node as IWhiteboardNode & { type: 'text' }
  const setNodes = useSetWhiteboardNodes()
  const handleChangeValue = (newValue: string) => {
    setNodes(s =>
      produce(s, draft => {
        draft.set(textNode.id, {
          ...textNode,
          content: newValue
        })
      })
    )
  }
  return (
    <textarea
      style={{
        background: 'transparent',
        width: '100%',
        height: '100%',
        resize: 'none',
        border: 'none',
        overflowY: 'auto',
        padding: '4px 6px'
      }}
      spellCheck="false"
      onKeyDownCapture={e => e.stopPropagation()}
      defaultValue={textNode.content || 'Input Text Here'}
      onChange={v => handleChangeValue(v.target.value)}
    />
  )
}

export default TextNode
