import { InnerNodeProps } from './WrapperNode'
import { IWhiteboardNode } from '~/typings'
import SimpleEditor from '@/core/components/editor/SimpleEditor'
import { useEffect, useRef } from 'react'
import { Button, IconWithPopover, Tooltip, WithBorder } from '@/components'
import ClassName from '@/styles/classNames'
import { useWhiteboardInstance } from '@/core/components/whiteboard/hooks/useWhiteboardInstance'

const TextNode = ({ node, setPopoverElements, onClick }: InnerNodeProps & { onClick: VoidFunction }) => {
  const textNode = node as IWhiteboardNode & { type: 'text' }
  const instance = useWhiteboardInstance()
  const firstChanged = useRef(false)
  const handleChangeValue = (newValue: string) => {
    instance.updateNode?.(textNode.id, n => ({ ...n, content: newValue }), false)
  }
  useEffect(() => {
    const z = containerRef.current?.querySelector('[role="textbox"]')
    if (z) {
      setTimeout(() => {
        const currHeight = z.scrollHeight
        instance.updateNode?.(textNode.id, n => ({ ...n, height: currHeight + 40 }), false)
      })
    }
  }, [node.content])

  const handleChangeSize = (newSize: (IWhiteboardNode & { type: 'text' })['fontSize']) => {
    instance.updateNode?.(textNode.id, n => ({ ...n, fontSize: newSize }))
  }
  const containerRef = useRef<HTMLElement>(null)
  // useEffect(() => {
  //   setPopoverElements?.(eles => [
  //     ...eles,
  //     () => (
  //       <Tooltip position="top" content={'Change font size'}>
  //         <IconWithPopover
  //           size={18}
  //           className={ClassName.circleButton(undefined, 4)}
  //           name={'park-add-text'}
  //           content={
  //             <WithBorder padding={6} style={{ width: 160 }}>
  //               <Button.IconButton onClick={() => handleChangeSize('super large')} text={'Super large'} />
  //               <Button.IconButton onClick={() => handleChangeSize('large')} text={'Large'} />
  //               <Button.IconButton onClick={() => handleChangeSize('middle')} text={'Middle'} />
  //               <Button.IconButton onClick={() => handleChangeSize('small')} text={'Small'} />
  //             </WithBorder>
  //           }
  //         />
  //       </Tooltip>
  //     )
  //   ])
  // }, [])

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
        height: '3rem',
        padding: '4px 0px 4px 4px',
        pointerEvents: 'auto',
        fontSize: getFontsize()
      }}
      ref={containerRef}
      onClick={onClick}
    >
      <SimpleEditor
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

export default TextNode
