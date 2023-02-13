import Icon from '@/components/base/Icon'
import { useMemoizedFn } from '@/hooks'
import { css } from '@emotion/css'
import classNames from 'classnames'
import { cloneElement, FC } from 'react'
import { Point, Range } from 'slate'
import { Editor, Path, Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { HeadingElement } from '../../types/commonElementTypes'
import styles from './index.module.less'

const Heading: FC<RenderElementProps> = ({ element, children }) => {
  const { type } = element
  const { folded } = element as HeadingElement
  const editor = useSlate()
  const action = () => {
    return (
      <span contentEditable={false}>
        <div
          onClick={useMemoizedFn(() => {
            let currentPath = ReactEditor.findPath(editor, element)
            const parentEle = Editor.node(editor, Path.parent(currentPath))[0]
            let currIdx = parentEle.children.findIndex(i => i === element) + 1
            while (parentEle.children[currIdx] && !parentEle.children[currIdx].type.startsWith('heading')) {
              currentPath = Path.next(currentPath)
              editor.apply({
                type: 'set_node',
                path: currentPath,
                properties: {
                  hide: folded 
                },
                newProperties: {
                  hide: !folded
                }
              })
              currIdx += 1
            }
            Transforms.setNodes(
              editor,
              {
                folded: !folded
              },
              { at: ReactEditor.findPath(editor, element) }
            )
            setTimeout(() => {
              editor.innerRef?.current.measure()
            })
          })}
        >
          <Icon
            theme="filled"
            name="park-right-one"
            size={20}
            style={{
              cursor: 'pointer',
              transform: !folded ? 'rotate(90deg)' : undefined,
              transition: 'transform 0.3s ease'
            }}
          />
        </div>
      </span>
    )
  }

  const heading = () => {
    switch (type) {
      case 'heading-one':
        return <h1></h1>
      case 'heading-two':
        return <h2></h2>
      case 'heading-three':
        return <h3></h3>
      case 'heading-four':
        return <h4></h4>
      case 'heading-five':
        return <h5></h5>
      case 'heading-six':
        return <h6></h6>
      default:
        return <h1></h1>
    }
  }
  const getLevel = () => {
    switch (type) {
      case 'heading-one':
        return 1
      case 'heading-two':
        return 2
      case 'heading-three':
        return 3
      case 'heading-four':
        return 4
      case 'heading-five':
        return 5
      case 'heading-six':
        return 6
      default:
        return 1
    }
  }
  return cloneElement(
    heading(),
    {
      id: element.id,
      suppressContentEditableWarning: true,
      className: css({
        display: 'flex',
        alignItems: 'center',
        gap: 10
      }),
      placeholder: `H${getLevel()}`,
      contentEditable: true
    },
    action(),
    children
  )
}

export default Heading
