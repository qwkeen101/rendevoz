import { Content, Icon } from '@/components/base'
import { css } from '@emotion/css'
import { MouseEventHandler } from 'react'
import { Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { ToDoElement } from '~/typings'
import Colors from '../consts/colors'
import useReadOnlyEditor from '../hooks/useReadOnly'

const ToDo = ({ element, children }: RenderElementProps) => {
  const editor = useSlate()
  const ele = element as ToDoElement
  const readOnly = useReadOnlyEditor()
  const toggleChecked: MouseEventHandler = e => {
    if (readOnly) return
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
    <Content flex alignItems="center" gap={10}>
      <Content
        flex
        centered
        contentEditable={false}
        onPointerDown={toggleChecked}
        className={css({
          borderRadius: 3,
          border: `1px solid var(--block-font-color, var(--font-tertiary))`,
          width: 16,
          height: 16,
          userSelect: 'none',
          cursor: 'pointer',
          ':hover': {
            borderColor: Colors.Font.Secondary
          }
        })}
      >
        {ele.checked && <Icon size={12} name="park-check" />}
      </Content>
      <div
        className={css({
          flex: 1,
          textDecoration: ele.checked ? 'line-through 0.05em' : undefined,
          opacity: ele.checked ? 0.8 : undefined,
          outline: 'none'
        })}
      >
        {children}
      </div>
    </Content>
  )
}

export default ToDo
