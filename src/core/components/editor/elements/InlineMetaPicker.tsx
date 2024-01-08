import { RenderElementProps } from 'slate-react'
import { AnimatePopover, Icon, WithBorder } from '@/components'
import { useEffect, useRef, useState } from 'react'
import isHotkey from 'is-hotkey'
import { Colors, KEY } from '@/consts'
import MetaFilterer from '@/core/object/filter/MetaFilterer'
import { Editor, Path, Transforms } from 'slate'
import { ReactEditor, useSlateStatic } from '@/core'
import { useMemoizedFn } from '@/hooks'
import { ClassName } from 'rendevoz'

const InlineMetaPicker = ({ element, children, attributes }: RenderElementProps) => {
  const editor = useSlateStatic()
  const [value, setValue] = useState('')
  const handleTransformPicker = useMemoizedFn((id?: number) => {
    const path = ReactEditor.findPath(editor, element)
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
      editor.on({
        type: 'linkToMeta',
        targetMetaId: id
      })
    } else {
      const text = value
      Transforms.removeNodes(editor, {
        at: path
      })
      const prev = element.isAt ? `@` : `[[`
      Transforms.insertText(editor, `${prev}${text}`)
    }
  })
  const ref = useRef<HTMLElement>(null)
  useEffect(() => {
    setTimeout(() => {
      ref.current?.focus()
    })
    const existHandler = (e: KeyboardEvent) => {
      if (isHotkey(KEY.Escape, e)) {
        e.preventDefault()
        e.stopPropagation()
        handleTransformPicker()
      }
    }
    document.addEventListener('keydown', existHandler, true)
    return () => {
      const path = Path.parent(ReactEditor.findPath(editor, element))
      const hasCurrent = Editor.hasPath(editor, path)
      const end = Editor.end(editor, hasCurrent ? path : Path.previous(path))
      ReactEditor.focus(editor)
      Transforms.select(editor, end)
      document.removeEventListener('keydown', existHandler, true)
    }
  }, [])
  return (
    <span
      {...attributes}
      style={{ background: Colors.Background.ButtonActive, padding: '2px 4px', margin: '0px 4px', borderRadius: 4, fontSize: '0.9em' }}
    >
      <AnimatePopover
        positions={['top', 'bottom']}
        padding={4}
        content={
          <WithBorder padding={4}>
            <MetaFilterer
              showCreate={{
                whiteboard: true,
                note: true
              }}
              onChange={id => {
                handleTransformPicker(id)
              }}
              withInput={false}
              currentInput={value}
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
          <input
            value={value}
            size={16}
            onChange={v => setValue(v.target.value)}
            className={ClassName.noStyleInput}
            placeholder={'Mention an object'}
            ref={ref}
          />
          {children}
        </span>
      </AnimatePopover>
    </span>
  )
}

export default InlineMetaPicker
