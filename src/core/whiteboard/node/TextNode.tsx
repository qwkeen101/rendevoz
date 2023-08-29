import { InnerNodeProps } from './WrapperNode'
import { useSetWhiteboardNodes } from '@/core/whiteboard/hooks'
import TextareaAutosize from '@/components/custom/input/autosizeTextarea'
import { IWhiteboardNode } from '~/typings'
import produce from 'immer'
import SimpleEditor from '@/core/editor/SimpleEditor'
import { useEffect } from 'react'
import { Button, Icon, IconWithPopover, Toolbar, Tooltip, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
const TextNode = ({ node, setPopoverElements }: InnerNodeProps) => {
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
  const handleChangeSize = (newSize: string) => {
    setNodes(s =>
      produce(s, draft => {
        const origin = s.get(textNode.id)
        draft.set(textNode.id, {
          ...origin,
          fontSize: newSize
        })
      })
    )
  }
  useEffect(() => {
    setPopoverElements?.(eles => [
      ...eles,
      () => (
        <Tooltip position="top" content={'Change font size'}>
          <IconWithPopover
            size={18}
            className={ClassName.circleButton(undefined, 4)}
            name={'park-add-text'}
            content={
              <WithBorder padding={6} style={{ width: 160 }}>
                <Button.IconButton onClick={() => handleChangeSize('super large')} text={'Super large'} style={{ fontSize: '1.5rem' }} />
                <Button.IconButton onClick={() => handleChangeSize('large')} text={'Large'} style={{ fontSize: '1.3rem' }} />
                <Button.IconButton onClick={() => handleChangeSize('middle')} text={'Middle'} style={{ fontSize: '1.1rem' }} />
                <Button.IconButton onClick={() => handleChangeSize('small')} text={'Small'} style={{ fontSize: '0.9rem' }} />
              </WithBorder>
            }
          />
        </Tooltip>
      )
    ])
  }, [])
  const getFontsize = () => {
    switch (node.fontSize) {
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
        height: '150px',
        padding: '4px 0px 4px 4px',
        fontSize: getFontsize()
      }}
    >
      <SimpleEditor value={textNode.content} onChange={v => handleChangeValue(v)} />
    </div>
  )
}

export default TextNode
