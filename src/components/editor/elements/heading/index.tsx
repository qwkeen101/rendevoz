import Icon from '@/components/base/Icon'
import { EditorEventHandler } from '@/events/editorEvent'
import useScopedEventEmitter from '@/events/useEventEmitter'
import { useMemoizedFn } from '@/hooks'
import { css } from '@emotion/css'
import { cloneElement, FC, useEffect, useRef, useState } from 'react'
import { Editor, Path, Range, Transforms } from 'slate'
import { ReactEditor, RenderElementProps, useSlate } from '../../slate-react'
import { HeadingElement } from '../../types/commonElementTypes'

const Heading: FC<RenderElementProps> = ({ element, children }) => {
  const { type } = element
  const { folded } = element as HeadingElement
  const editor = useSlate()
  const isEmpty = Editor.isEmpty(editor, element) ? true : false
  const [isComposing, setIsComposing] = useState(false)
  const emitter = useScopedEventEmitter()

  useEffect(() => {
    const handler = new EditorEventHandler()
    handler.on('compositionEnd', () => {
      setIsComposing(false)
    })
    handler.on('compositionStart', () => {
      const path = ReactEditor.findPath(editor, element)
      if (editor.selection && Range.includes(editor.selection, path)) {
        setIsComposing(true)
      }
    })
    emitter.addListener('editor', handler)
    return () => {
      emitter.removeListener('editor', handler)
    }
  }, [])

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
      })
    },
    action(),
    children,
    isEmpty && !isComposing && (
      <div style={{ position: 'absolute', left: 30, pointerEvents: 'none', userSelect: 'none', color: 'rgba(133, 144, 174, 0.4)' }}>
        H{getLevel()}
      </div>
    )
  )
}

export default Heading
