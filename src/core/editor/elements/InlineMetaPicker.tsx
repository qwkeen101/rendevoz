import { RenderElementProps } from 'slate-react'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { useEffect } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import MetaFilterer from '@/core/database/filter/MetaFilterer'
import { Path, Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from '@/core'
import Id from '@/utils/id'
import { useMemoizedFn } from '@/hooks'
import { Rendevoz } from '@/core/rendevoz'

const InlineMetaPicker = ({ element, children, attributes }: RenderElementProps) => {
  const editor = useSlateStatic()
  const handleTransformPicker = useMemoizedFn((id?: number) => {
    const path = ReactEditor.findPath(editor, element)
    console.log(element)
    if (id) {
      Transforms.setNodes(
        editor,
        {
          originId: id,
          type: 'inline-metaObject'
        },
        {
          at: path
        }
      )
      Rendevoz.Events.Emit.GlobalEventEmitter.emit('global', {
        type: 'globalDropNeedFurtherProcess',
        data: {
          draggingElement: {
            type: 'metaElement',
            metaId: id
          },
          dropOn: {
            dropOn: 'editor',
            noteId: editor.noteId
          }
        }
      })
    } else {
      const text = element.children[0].text
      Transforms.removeNodes(editor, {
        at: path
      })
      const prev = element.isAt ? `@` : `[[`
      Transforms.insertText(editor, `${prev}${text}`)
    }

    Transforms.select(editor, Path.next(path))
    ReactEditor.focus(editor)
  })
  useEffect(() => {
    const existHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        handleTransformPicker()
      }
    }
    document.addEventListener('keydown', existHandler)
    return () => {
      document.removeEventListener('keydown', existHandler)
    }
  })
  return (
    <span {...attributes} style={{ background: Colors.Background.ButtonActive, padding: '2px 4px', margin: '0px 4px', borderRadius: 4, fontSize: '0.9em' }}>
      <AnimatePopover
        positions={['top', 'bottom']}
        padding={4}
        content={
          <WithBorder padding={6} style={{}}>
            <MetaFilterer
              showCreate={{
                whiteboard: true,
                note: true
              }}
              onChange={id => {
                handleTransformPicker(id)
              }}
              withInput={false}
              currentInput={element.children[0].text}
            />
          </WithBorder>
        }
        visible={true}
        onClickOutside={() => handleTransformPicker()}
      >
        <span>
          <span contentEditable={false}>
            <Icon name={'park-search'} containerStyle={{ display: 'inline', marginRight: 4, fontSize: '0.9em' }} />
          </span>
          {children}
          {element.children[0].text.length === 0 && (
            <span contentEditable={false} style={{ color: Colors.Font.Description, fontSize: '0.8em' }}>
              Mention an object
            </span>
          )}
        </span>
      </AnimatePopover>
    </span>
  )
}

export default InlineMetaPicker
