import { Content, Icon } from '@/components/base'
import { css } from '@emotion/css'
import { MouseEventHandler } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { ToDoElement } from '~/typings'

const ToDo = ({ element, children }: RenderElementProps) => {
  const editor = useSlate()
  const ele = element as ToDoElement
  const toggleChecked: MouseEventHandler = e => {
    if (editor.readonly) return
    e.preventDefault()
    e.stopPropagation()
    const path = ReactEditor.findPath(editor, ele)
    Transforms.setNodes(
      editor,
      {
        checked: !ele.checked
      },
      { at: path }
    )
  }
  return (
    <Content flex alignItems="center" gap={10} contentEditable={false}>
      <Content
        flex
        centered
        onPointerDown={toggleChecked}
        className={css({
          borderRadius: 3,
          border: '1px solid rgba(0,0,0,0.5)',
          width: 16,
          height: 16,
          userSelect: 'none',
          cursor: 'pointer',
          ':hover': {
            borderColor: '#8590ae'
          }
        })}
      >
        {ele.checked && <Icon size={12} fill="#8590ae" name="park-check" />}
      </Content>
      <div
        className={css({
          flex: 1,
          textDecoration: ele.checked ? 'line-through 0.05em' : undefined,
          opacity: ele.checked ? 0.8 : undefined,
          outline: 'none'
        })}
        contentEditable={true}
      >
        {children}
      </div>
    </Content>
  )
}

export default ToDo
